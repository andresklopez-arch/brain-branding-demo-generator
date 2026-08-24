// Prueba de humo end-to-end contra los emuladores (Auth 9099, Firestore
// 8080, Functions 5001). No toca producción. Corre vía:
//   npm run test:alr-saas
// (requiere functions/.secret.local con ALR_ADMIN_PIN=947261 -- el CI lo
// genera solo, ver .github/workflows/alr-saas-tests.yml).
const admin = require("firebase-admin");

const PROJECT_ID = "brain-branding";
const API_KEY = "fake-api-key";
const TEST_PIN = "947261";
const AUTH_BASE = `http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1`;
const TOKEN_BASE = `http://127.0.0.1:9099/securetoken.googleapis.com/v1`;
const FUNCTIONS_BASE = `http://127.0.0.1:5001/${PROJECT_ID}/us-central1`;
const FIRESTORE_DOCS_BASE = `http://127.0.0.1:8080/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

let passed = 0, failed = 0;
function check(label, cond, detail) {
  if (cond) { console.log(`✅ ${label}`); passed++; }
  else { console.error(`❌ ${label}${detail ? " — " + detail : ""}`); failed++; }
}

async function signInAnon() {
  const res = await fetch(`${AUTH_BASE}/accounts:signUp?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }),
  });
  return res.json();
}
async function refreshIdToken(refreshToken) {
  const res = await fetch(`${TOKEN_BASE}/token?key=${API_KEY}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
  });
  const json = await res.json();
  return json.id_token;
}
async function callFunction(name, idToken, data) {
  const res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ data }),
  });
  return { status: res.status, json: await res.json() };
}
async function firestoreGet(idToken, path) {
  const res = await fetch(`${FIRESTORE_DOCS_BASE}/${path}`, { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} });
  return { status: res.status, json: await res.json() };
}
async function firestoreSet(idToken, path, fields) {
  const res = await fetch(`${FIRESTORE_DOCS_BASE}/${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
    body: JSON.stringify({ fields }),
  });
  return { status: res.status, json: await res.json() };
}

(async () => {
  await db.doc("master_licenses/testclient").set({
    clientName: "Test Client SA",
    status: "SUSPENDED",
    gracePeriodHours: 48,
  });
  await db.doc("master_licenses/testclient/secrets/apiKey").set({ value: "sec_super_secret_should_never_leak" });

  // --- verifyAlrAdminAccess: PIN básico ---
  const u1 = await signInAnon();
  const wrongPin = await callFunction("verifyAlrAdminAccess", u1.idToken, { pin: "000000" });
  check("verifyAlrAdminAccess con PIN incorrecto deniega", wrongPin.status !== 200 || !!wrongPin.json.error);

  const u2 = await signInAnon();
  const rightPin = await callFunction("verifyAlrAdminAccess", u2.idToken, { pin: TEST_PIN, username: "SmokeAdmin" });
  check("verifyAlrAdminAccess con PIN correcto responde ok", rightPin.status === 200 && rightPin.json.result?.ok, JSON.stringify(rightPin.json));

  // --- getPublicLicenseStatus: expone SOLO status/gracePeriodHours ---
  const statusRes = await fetch(`${FUNCTIONS_BASE}/getPublicLicenseStatus?appId=testclient`);
  const statusJson = await statusRes.json();
  check("getPublicLicenseStatus devuelve el status real", statusJson.status === "SUSPENDED");
  check("getPublicLicenseStatus NO expone apiKey ni clientName", !("apiKey" in statusJson) && !("clientName" in statusJson));

  const missingRes = await fetch(`${FUNCTIONS_BASE}/getPublicLicenseStatus?appId=no_existe`);
  const missingJson = await missingRes.json();
  check("getPublicLicenseStatus con appId inexistente falla abierto (ACTIVE)", missingJson.status === "ACTIVE");

  // --- firestore.rules: sin claim ---
  const anon = await signInAnon();
  const anonRead = await firestoreGet(anon.idToken, "master_licenses/testclient");
  check("Sesión anónima SIN claim NO puede leer master_licenses", anonRead.status === 403 || !!anonRead.json.error);
  const anonWrite = await firestoreSet(anon.idToken, "master_licenses/testclient", { status: { stringValue: "ACTIVE" } });
  check("Sesión anónima SIN claim NO puede escribir master_licenses", anonWrite.status === 403 || !!anonWrite.json.error);
  const anonSecretRead = await firestoreGet(anon.idToken, "master_licenses/testclient/secrets/apiKey");
  check("Sesión anónima SIN claim NO puede leer la subcolección secrets/apiKey", anonSecretRead.status === 403 || !!anonSecretRead.json.error);

  // --- firestore.rules: con claim (tras verifyAlrAdminAccess) ---
  const admin2 = await signInAnon();
  await callFunction("verifyAlrAdminAccess", admin2.idToken, { pin: TEST_PIN, username: "SmokeAdmin2" });
  const adminFreshToken = await refreshIdToken(admin2.refreshToken);
  const adminRead = await firestoreGet(adminFreshToken, "master_licenses/testclient");
  check("Con claim alrSuperAdmin SÍ puede leer master_licenses", adminRead.status === 200);
  const adminSecretRead = await firestoreGet(adminFreshToken, "master_licenses/testclient/secrets/apiKey");
  check("Con claim alrSuperAdmin SÍ puede leer secrets/apiKey", adminSecretRead.status === 200);

  // --- firestore.rules: alr-saas-app-registry (config de auto-clonado) ---
  const anonRegistryRead = await firestoreGet(anon.idToken, "alr-saas-app-registry/rey_xalpa");
  check("Sesión anónima SIN claim NO puede leer alr-saas-app-registry", anonRegistryRead.status === 403 || !!anonRegistryRead.json.error);
  const adminRegistryWrite = await firestoreSet(adminFreshToken, "alr-saas-app-registry/rey_xalpa", { firebaseProjectId: { stringValue: "rey-smart-wash" } });
  check("Con claim alrSuperAdmin SÍ puede escribir alr-saas-app-registry", adminRegistryWrite.status === 200, JSON.stringify(adminRegistryWrite.json));

  // --- TOTP real ---
  const totpUser = "TotpSmokeAdmin";
  const enrollRes = await callFunction("enrollTotp", adminFreshToken, { username: totpUser });
  check("enrollTotp (con claim alrSuperAdmin) responde ok con un secreto", enrollRes.status === 200 && !!enrollRes.json.result?.secret, JSON.stringify(enrollRes.json));

  const noClaimUser = await signInAnon();
  const enrollDenied = await callFunction("enrollTotp", noClaimUser.idToken, { username: "otro" });
  check("enrollTotp SIN claim alrSuperAdmin es denegado", enrollDenied.status !== 200 || !!enrollDenied.json.error);

  if (enrollRes.json.result?.secret) {
    const { authenticator } = require("otplib");
    const secret = enrollRes.json.result.secret;
    const validCode = authenticator.generate(secret);

    const u3 = await signInAnon();
    const pinOnlyAfterEnroll = await callFunction("verifyAlrAdminAccess", u3.idToken, { pin: TEST_PIN, username: totpUser });
    check("Tras enrolar TOTP, el PIN solo (sin código) ya no basta", pinOnlyAfterEnroll.status !== 200 || !!pinOnlyAfterEnroll.json.error, JSON.stringify(pinOnlyAfterEnroll.json));

    const u4 = await signInAnon();
    const pinPlusTotp = await callFunction("verifyAlrAdminAccess", u4.idToken, { pin: TEST_PIN, totpCode: validCode, username: totpUser });
    check("PIN + código TOTP válido sí autoriza", pinPlusTotp.status === 200 && pinPlusTotp.json.result?.ok, JSON.stringify(pinPlusTotp.json));

    const disableRes = await callFunction("disableTotp", await refreshIdToken(u4.refreshToken), { pin: TEST_PIN, username: totpUser });
    check("disableTotp con PIN correcto responde ok", disableRes.status === 200 && disableRes.json.result?.ok, JSON.stringify(disableRes.json));

    const u5 = await signInAnon();
    const pinOnlyAfterDisable = await callFunction("verifyAlrAdminAccess", u5.idToken, { pin: TEST_PIN, username: totpUser });
    check("Tras desactivar TOTP, el PIN solo vuelve a bastar", pinOnlyAfterDisable.status === 200 && pinOnlyAfterDisable.json.result?.ok, JSON.stringify(pinOnlyAfterDisable.json));
  }

  // --- Rate limiting server-side (por IP) ---
  const rateLimitUser = "RateLimitSmokeAdmin";
  let lastResult = null;
  for (let i = 0; i < 6; i++) {
    const u = await signInAnon();
    lastResult = await callFunction("verifyAlrAdminAccess", u.idToken, { pin: "000000", username: rateLimitUser });
  }
  check("Tras 6 intentos fallidos seguidos, la función bloquea por rate-limit (resource-exhausted)", lastResult.status !== 200 && /intentos fallidos/i.test(lastResult.json.error?.message || ""), JSON.stringify(lastResult.json));

  // --- provisionAppClone: gating de acceso ---
  // Cobertura parcial a propósito: probar el flujo feliz completo
  // requeriría un segundo proyecto Firebase real (ej. rey-smart-wash) --
  // eso se verifica manualmente contra producción (ver plan), no aquí.
  // Lo que SÍ se prueba en automático es la parte crítica de seguridad:
  // que nadie sin el claim alrSuperAdmin puede disparar un clonado, y que
  // un appId sin auto-clonado configurado no intenta llamar a nada.
  const cloneNoClaimUser = await signInAnon();
  const cloneDenied = await callFunction("provisionAppClone", cloneNoClaimUser.idToken, { appId: "no_existe", tenantId: "smoke_clone_test", businessName: "Smoke Clone Test" });
  check("provisionAppClone SIN claim alrSuperAdmin es denegado", cloneDenied.status !== 200 || !!cloneDenied.json.error, JSON.stringify(cloneDenied.json));

  const cloneNoRegistry = await callFunction("provisionAppClone", adminFreshToken, { appId: "app_sin_registro_de_clonado", tenantId: "smoke_clone_test2", businessName: "Smoke Clone Test 2" });
  check("provisionAppClone con appId sin registro en alr-saas-app-registry falla con failed-precondition", cloneNoRegistry.status !== 200 && /auto-clonado/i.test(cloneNoRegistry.json.error?.message || ""), JSON.stringify(cloneNoRegistry.json));

  // --- deprovisionAppClone / testAppCloneConnection / listLoginAttempts: gating ---
  // Mismo criterio que arriba: solo se prueba en automático que ninguna
  // de las 3 funciones nuevas (borrado real, probar conexión, auditoría)
  // es alcanzable sin el claim alrSuperAdmin. El flujo feliz de
  // deprovisionAppClone se prueba manualmente en producción, igual que
  // provisionAppClone.
  const noClaimUser2 = await signInAnon();
  const deprovDenied = await callFunction("deprovisionAppClone", noClaimUser2.idToken, { appId: "no_existe", tenantId: "smoke_deprov_test" });
  check("deprovisionAppClone SIN claim alrSuperAdmin es denegado", deprovDenied.status !== 200 || !!deprovDenied.json.error, JSON.stringify(deprovDenied.json));

  const testConnDenied = await callFunction("testAppCloneConnection", noClaimUser2.idToken, { appId: "no_existe" });
  check("testAppCloneConnection SIN claim alrSuperAdmin es denegado", testConnDenied.status !== 200 || !!testConnDenied.json.error, JSON.stringify(testConnDenied.json));

  const testConnNoRegistry = await callFunction("testAppCloneConnection", adminFreshToken, { appId: "app_sin_registro_de_clonado" });
  check("testAppCloneConnection con appId sin registro falla con failed-precondition", testConnNoRegistry.status !== 200 && /auto-clonado/i.test(testConnNoRegistry.json.error?.message || ""), JSON.stringify(testConnNoRegistry.json));

  const listAttemptsDenied = await callFunction("listLoginAttempts", noClaimUser2.idToken, {});
  check("listLoginAttempts SIN claim alrSuperAdmin es denegado", listAttemptsDenied.status !== 200 || !!listAttemptsDenied.json.error, JSON.stringify(listAttemptsDenied.json));

  const listAttemptsOk = await callFunction("listLoginAttempts", adminFreshToken, {});
  check("listLoginAttempts con claim alrSuperAdmin responde ok con un arreglo", listAttemptsOk.status === 200 && Array.isArray(listAttemptsOk.json.result?.attempts), JSON.stringify(listAttemptsOk.json));

  const restoreDenied = await callFunction("restoreAppCloneBackup", noClaimUser2.idToken, { appId: "no_existe", tenantId: "smoke_restore_test" });
  check("restoreAppCloneBackup SIN claim alrSuperAdmin es denegado", restoreDenied.status !== 200 || !!restoreDenied.json.error, JSON.stringify(restoreDenied.json));

  console.log(`\n${passed} prueba(s) pasaron, ${failed} fallaron.`);
  process.exit(failed > 0 ? 1 : 0);
})().catch(e => { console.error("Error inesperado:", e); process.exit(1); });
