import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const base = process.env.TEST_URL || "http://127.0.0.1:5173";
const cdp = process.env.CDP_URL || "http://127.0.0.1:9222";
const output = process.env.TEST_OUTPUT || "/tmp/nexa-sense-checks";
await mkdir(output, { recursive: true });
const info = await (await fetch(`${cdp}/json/version`)).json();
const ws = new WebSocket(info.webSocketDebuggerUrl);
await new Promise((r, j) => {
  ws.addEventListener("open", r, { once: true });
  ws.addEventListener("error", j, { once: true });
});
let next = 0;
const pending = new Map(),
  errors = [],
  networkFailures = [],
  checks = [];
let session;
ws.addEventListener("message", (e) => {
  const d = JSON.parse(e.data);
  if (d.id) {
    const p = pending.get(d.id);
    if (p) {
      pending.delete(d.id);
      clearTimeout(p.timer);
      if (d.error) p.reject(Error(JSON.stringify(d.error)));
      else p.resolve(d.result);
    }
  }
  if (d.sessionId === session && d.method === "Runtime.exceptionThrown")
    errors.push(
      d.params.exceptionDetails.exception?.description ||
        d.params.exceptionDetails.text,
    );
  if (
    d.sessionId === session &&
    d.method === "Network.responseReceived" &&
    d.params.response.url.startsWith(base) &&
    d.params.response.status >= 400
  )
    networkFailures.push(d.params.response.url);
});
function send(method, params = {}, sessionId = session) {
  return new Promise((resolve, reject) => {
    const id = ++next;
    const timer = setTimeout(
      () => reject(Error(`CDP timeout: ${method}`)),
      15000,
    );
    pending.set(id, { resolve, reject, timer });
    ws.send(
      JSON.stringify({
        id,
        method,
        params,
        ...(sessionId ? { sessionId } : {}),
      }),
    );
  });
}
async function ev(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails)
    throw Error(
      r.exceptionDetails.exception?.description ||
        JSON.stringify(r.exceptionDetails),
    );
  return r.result.value;
}
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
function check(v, label) {
  assert.ok(v, label);
  checks.push(label);
}
async function until(expression) {
  for (let i = 0; i < 100; i++) {
    if (await ev(expression)) return;
    await pause(50);
  }
  throw Error(`Timeout: ${expression}`);
}
async function route(path, title) {
  console.log(`Route ${path}`);
  await ev(`location.hash=${JSON.stringify("#" + path)}`);
  await until(
    `document.querySelector('h1')?.textContent===${JSON.stringify(title)}`,
  );
  await pause(80);
}
async function click(text, scope = "document") {
  const point = await ev(
    `(()=>{const b=[...${scope}.querySelectorAll('button,a')].find(b=>b.textContent.trim()===${JSON.stringify(text)});if(!b)throw Error('Missing button: '+${JSON.stringify(text)});if(b.disabled)throw Error('Disabled button');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`,
  );
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    ...point,
    button: "left",
    clickCount: 1,
  });
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    ...point,
    button: "left",
    clickCount: 1,
  });
  await pause(80);
}
async function confirm(label = "Confirmar") {
  await until(`!!document.querySelector('dialog[open]')`);
  await click(label, "document.querySelector('dialog[open]')");
  await until(`!document.querySelector('dialog[open]')`);
}
async function input(selector, value) {
  await ev(
    `(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await pause(70);
}
async function shot(name) {
  const r = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(`${output}/${name}.png`, Buffer.from(r.data, "base64"));
}
async function viewport(w, h) {
  console.log(`Viewport ${w}x${h}`);
  await send("Emulation.setDeviceMetricsOverride", {
    width: w,
    height: h,
    deviceScaleFactor: 1,
    mobile: w <= 600,
  });
  await pause(80);
}
const stored = () => ev(`JSON.parse(localStorage.getItem('nexa-sense:v1'))`);
const context = await send("Target.createBrowserContext", {}, null);
const target = await send(
  "Target.createTarget",
  { url: "about:blank", browserContextId: context.browserContextId },
  null,
);
const attached = await send(
  "Target.attachToTarget",
  { targetId: target.targetId, flatten: true },
  null,
);
session = attached.sessionId;
try {
  await send("Page.enable");
  await send("Page.bringToFront");
  await send("Runtime.enable");
  await send("Network.enable");
  await viewport(1440, 900);
  await send("Page.navigate", { url: base });
  await until(`document.querySelector('h1')?.textContent==='Visão geral'`);
  await ev("document.fonts.ready");
  check((await stored()).scenarioId === "queue", "Initial scenario A");
  check(
    (await stored()).measurements[0].metrics.queue === 9,
    "Initial queue 9",
  );
  await shot("desktop-overview");
  await route("/monitoramento", "Monitoramento");
  check(
    await ev(
      `document.body.textContent.includes('Nenhum acompanhamento iniciado.')`,
    ),
    "Monitoring empty state",
  );
  await route("/resultados", "Resultados");
  check(
    await ev(`!document.querySelector('.comparison-grid')`),
    "No premature operational result",
  );
  check(
    await ev(
      `document.querySelector('[data-testid="finance-total"]').textContent.includes('486')`,
    ),
    "Initial illustrative financial estimate 486",
  );
  await input("#result-ticket", "80");
  check(
    await ev(
      `document.querySelector('[data-testid="finance-total"]').textContent.includes('661')`,
    ),
    "Ticket recalculates financial hypothesis to 661",
  );
  await input("#result-ticket", "-1");
  check(
    await ev(
      `document.querySelector('#result-ticket').getAttribute('aria-invalid')==='true'`,
    ),
    "Invalid ticket displays validation",
  );
  check(
    (await stored()).settings.ticket === 80,
    "Invalid ticket not persisted",
  );
  await input("#result-ticket", "55");
  await route("/mapa", "Mapa do bar");
  check(
    await ev(`document.querySelectorAll('.table').length===22`),
    "Map has 22 accessible tables",
  );
  await ev(`document.querySelectorAll('.table')[18].click()`);
  await click(
    "Disponível e preparada",
    "document.querySelector('.table-state-actions')",
  );
  check(
    (await stored()).tables.filter((t) => t.status === "available").length ===
      1,
    "Table edit updates shared state",
  );
  await route("/", "Visão geral");
  check(
    await ev(
      `document.querySelectorAll('.metric')[2].textContent.includes('18')`,
    ),
    "Overview occupancy derives from shared tables",
  );
  await route("/mapa", "Mapa do bar");
  await click("Restaurar mapa do cenário");
  await confirm("Restaurar mapa");
  check(
    (await stored()).tables.filter((t) => t.status === "needs_preparation")
      .length === 4,
    "Map reset restores stage counts",
  );
  await route("/alertas/service", "Demora no atendimento");
  await click("Registrar ação executada");
  check((await stored()).status === "detected", "Action awaits confirmation");
  await click("Cancelar", "document.querySelector('dialog[open]')");
  check((await stored()).status === "detected", "Cancel preserves state");
  await click("Registrar ação executada");
  await confirm("Confirmar ação");
  let s = await stored();
  check(
    s.status === "action_registered" && s.action.time === "20:46",
    "Action registered at simulated 20:46",
  );
  check(
    s.measurements[0].metrics.queue === 9 && s.measurements.length === 1,
    "Action does not change indicators immediately",
  );
  check(
    await ev(
      `![...document.querySelectorAll('button')].some(b=>b.textContent==='Registrar ação executada')`,
    ),
    "No duplicate action control",
  );
  await click("Iniciar acompanhamento");
  check(
    (await stored()).status === "monitoring",
    "Monitoring starts separately",
  );
  await route("/monitoramento", "Monitoramento");
  check(
    await ev(`document.querySelectorAll('.chart').length===2`),
    "Two measurement charts",
  );
  await click("Avançar acompanhamento de 15 minutos");
  s = await stored();
  check(
    s.status === "completed" && s.measurements[1].time === "21:01",
    "Advance completes at 21:01",
  );
  check(
    s.measurements[1].metrics.queue === 2 &&
      s.measurements[1].metrics.wait === 5,
    "Scenario A expected final queue and wait",
  );
  check(
    s.tables.filter((t) => t.status === "occupied").length === 21 &&
      s.tables.filter((t) => t.status === "available").length === 1,
    "Scenario A final table sum 22",
  );
  await route("/resultados", "Resultados");
  check(
    await ev(
      `document.querySelectorAll('.comparison').length===4&&document.querySelector('.result-insight').textContent.includes('77,8')`,
    ),
    "Four comparisons and 77.8% reduction",
  );
  await shot("desktop-results");
  await send("Page.reload");
  await until(`document.querySelectorAll('.comparison').length===4`);
  check(
    (await stored()).status === "completed",
    "Persistence survives page reload",
  );
  for (const [index, id, title, queue, wait, occupied, prep, available] of [
    [1, "tables", "Mesas sem preparação", 3, 6, 19, 2, 1],
    [2, "team", "Equipe mal distribuída", 3, 6, 19, 1, 2],
  ]) {
    await route("/simulador", "Laboratório de situações");
    await ev(
      `document.querySelectorAll('.scenario-card button')[${index}].click()`,
    );
    await confirm("Iniciar cenário");
    s = await stored();
    check(
      s.scenarioId === id &&
        s.status === "detected" &&
        s.action === null &&
        s.events.length === 1,
      `${title}: clean switch`,
    );
    await click("Ver recomendação");
    await click("Registrar ação executada");
    await confirm("Confirmar ação");
    await click("Iniciar acompanhamento");
    await click("Avançar acompanhamento de 15 minutos");
    s = await stored();
    const m = s.measurements[1].metrics;
    check(
      m.queue === queue &&
        m.wait === wait &&
        m.occupied === occupied &&
        m.needs_preparation === prep &&
        m.available === available,
      `${title}: exact result`,
    );
  }
  await route("/configuracoes", "Configurações");
  await input('input[type="number"][max="100"]', "100");
  await input('input[type="number"][max="120"]', "120");
  await input('input[type="number"][max="22"]', "22");
  await click("Salvar configurações");
  check((await stored()).settings.queueLimit === 100, "Settings saved");
  await input('input[type="number"][max="100"]', "-1");
  await click("Salvar configurações");
  check(
    await ev(`!!document.querySelector('.settings-save .field-error')`),
    "Invalid setting error visible",
  );
  check(
    (await stored()).settings.queueLimit === 100,
    "Invalid settings not persisted",
  );
  await click("Restaurar configurações");
  await confirm();
  check(
    (await stored()).settings.queueLimit === 6,
    "Settings restore defaults",
  );
  await click("Reiniciar todos os cenários");
  await confirm();
  check(
    (await stored()).scenarioId === "queue" &&
      (await stored()).status === "detected",
    "Global reset returns to A",
  );
  await input('input[type="number"][max="100"]', "100");
  await input('input[type="number"][max="120"]', "120");
  await input('input[type="number"][max="22"]', "22");
  await click("Salvar configurações");
  await route("/alertas", "Central de alertas");
  check(
    await ev(
      `document.body.textContent.includes('Nenhuma ocorrência neste filtro')`,
    ),
    "Threshold changes produce no-occurrence state",
  );
  await route("/configuracoes", "Configurações");
  await click("Restaurar configurações");
  await confirm();
  await click("Limpar histórico local");
  await confirm();
  check(
    (await stored()).events.length === 0,
    "History clear removes activity only",
  );
  await click("Reiniciar todos os cenários");
  await confirm();
  const routes = [
    ["/", "Visão geral"],
    ["/mapa", "Mapa do bar"],
    ["/alertas", "Central de alertas"],
    ["/alertas/service", "Demora no atendimento"],
    ["/monitoramento", "Monitoramento"],
    ["/resultados", "Resultados"],
    ["/simulador", "Laboratório de situações"],
    ["/configuracoes", "Configurações"],
  ];
  for (const [w, h] of [
    [360, 800],
    [375, 667],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    await viewport(w, h);
    for (const [path, title] of routes) {
      await route(path, title);
      check(
        await ev(`document.documentElement.scrollWidth<=innerWidth`),
        `No horizontal overflow ${path} ${w}x${h}`,
      );
      check(
        await ev(
          `!!document.querySelector('h1')&&document.querySelector('h1').getBoundingClientRect().width<=innerWidth`,
        ),
        `Heading fits ${path} ${w}`,
      );
      if (path === "/mapa") {
        await ev(`document.querySelectorAll('.table')[21].click()`);
        check(
          await ev(
            `document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.table-details').textContent.includes('Mesa 22')`,
          ),
          `Table 22 detail accessible ${w}`,
        );
      }
      if (w === 390 || w === 1440)
        await shot(`${w}-${path.replaceAll("/", "-") || "overview"}`);
    }
  }
  await route("/simulador", "Laboratório de situações");
  await click("Registrar ação executada");
  await confirm("Confirmar ação");
  await click("Iniciar acompanhamento");
  await click("Avançar acompanhamento de 15 minutos");
  for (const [w, h] of [
    [360, 800],
    [375, 667],
    [390, 568],
    [430, 932],
    [768, 1024],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
  ]) {
    await viewport(w, h);
    for (const [path, title] of [
      ["/monitoramento", "Monitoramento"],
      ["/resultados", "Resultados"],
      ["/simulador", "Laboratório de situações"],
      ["/alertas", "Central de alertas"],
    ]) {
      await route(path, title);
      check(
        await ev(`document.documentElement.scrollWidth<=innerWidth`),
        `Completed layout fits ${path} ${w}`,
      );
      if (path === "/monitoramento")
        check(
          await ev(`document.querySelectorAll('.chart').length===2`),
          `Monitoring charts present ${w}`,
        );
      if (path === "/resultados")
        check(
          await ev(`document.querySelectorAll('.comparison').length===4`),
          `Before/after present ${w}`,
        );
      if (w === 390 || w === 1440)
        await shot(`${w}-completed-${path.slice(1)}`);
      if (w < 769) {
        await ev(`window.scrollTo(0,document.body.scrollHeight)`);
        check(
          await ev(
            `document.querySelector('.page-footer').getBoundingClientRect().bottom<=document.querySelector('.mobile-nav').getBoundingClientRect().top`,
          ),
          `Bottom navigation leaves content reachable ${path} ${w}`,
        );
      }
    }
  }
  await viewport(390, 844);
  await route("/", "Visão geral");
  await click("Mais", "document.querySelector('.mobile-nav')");
  check(
    await ev(
      `document.querySelector('dialog[open] .more-nav a').textContent.includes('Mapa')`,
    ),
    "Mobile More menu exposes routes",
  );
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Escape",
    code: "Escape",
    windowsVirtualKeyCode: 27,
  });
  await until(`!document.querySelector('dialog[open]')`);
  check(
    await ev(`document.activeElement.textContent==='Mais'`),
    "Escape closes dialog and restores focus",
  );
  await click("Mais", "document.querySelector('.mobile-nav')");
  await ev(`document.querySelector('dialog[open] .icon-button').focus()`);
  await send("Input.dispatchKeyEvent", {
    type: "keyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    modifiers: 8,
  });
  await send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    modifiers: 8,
  });
  check(
    await ev(`!!document.activeElement.closest('dialog[open]')`),
    "Dialog traps backward keyboard focus",
  );
  await click("Mapa do bar", "document.querySelector('dialog[open]')");
  await until(`document.querySelector('h1')?.textContent==='Mapa do bar'`);
  check(
    await ev(`!document.querySelector('dialog[open]')`),
    "Mobile navigation opens requested page and closes menu",
  );
  await send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  check(
    await ev(
      `matchMedia('(prefers-reduced-motion: reduce)').matches&&getComputedStyle(document.querySelector('.button')).transitionDuration==='0s'`,
    ),
    "Reduced motion disables transitions",
  );
  await ev(`localStorage.setItem('nexa-sense:v1','{invalid')`);
  await send("Page.reload");
  await until(`document.querySelector('h1')?.textContent==='Mapa do bar'`);
  check(
    (await stored()).status === "detected" &&
      (await stored()).tables.length === 22,
    "Corrupt persisted state restores safe initial demo",
  );
  check(errors.length === 0, `No runtime exceptions: ${errors.join(";")}`);
  check(
    networkFailures.length === 0,
    `No failed local assets: ${networkFailures.join(";")}`,
  );
  await writeFile(
    `${output}/report.json`,
    JSON.stringify(
      { passed: checks.length, checks, errors, networkFailures },
      null,
      2,
    ),
  );
  console.log(
    `${checks.length} browser checks passed. Screenshots and report: ${output}`,
  );
} catch (error) {
  console.error(error);
  await writeFile(
    `${output}/failure.json`,
    JSON.stringify(
      { error: String(error), checks, errors, networkFailures },
      null,
      2,
    ),
  );
  throw error;
} finally {
  try {
    await send("Target.closeTarget", { targetId: target.targetId }, null);
  } finally {
    ws.close();
  }
}
