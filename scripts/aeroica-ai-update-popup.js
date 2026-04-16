const MODULE_ID = "aeroica-homebrew-vtt-ai";
const POPUP_SETTING = "lastSeenAiUpdateVersion";

const LOGO_PATH = "https://raw.githubusercontent.com/AeroicaGaming/aeroica-homebrew-vtt-ai/main/assets/2023%20STATIC%20LOGO%20.png";
const MANIFEST_URL = "https://raw.githubusercontent.com/AeroicaGaming/aeroica-homebrew-vtt-ai/main/module.json";
const RELEASES_URL = "https://github.com/AeroicaGaming/aeroica-homebrew-vtt-ai/releases";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, POPUP_SETTING, {
    name: "Last Seen AI Update Version",
    hint: "Tracks if the GM has seen the AI update popup.",
    scope: "client",
    config: false,
    type: String,
    default: ""
  });
});

Hooks.once("ready", async () => {
  if (!game.user?.isGM) return;

  const mod = game.modules.get(MODULE_ID);
  if (!mod) return;

  const currentVersion = mod.version ?? "0.0.0";

  let remoteVersion;

  try {
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    remoteVersion = data.version;
  } catch (err) {
    console.warn(`${MODULE_ID} | Failed to fetch remote manifest`, err);
    return;
  }

  if (!remoteVersion) return;

  // Only continue if newer version exists
  if (!foundry.utils.isNewerVersion(remoteVersion, currentVersion)) return;

  const lastSeen = game.settings.get(MODULE_ID, POPUP_SETTING);
  if (lastSeen === remoteVersion) return;

  await renderAeroicaAiUpdateDialog({
    currentVersion,
    remoteVersion
  });

  await game.settings.set(MODULE_ID, POPUP_SETTING, remoteVersion);
});

async function renderAeroicaAiUpdateDialog({ currentVersion, remoteVersion }) {

  const content = `
  <section class="aeroica-welcome">

    <header class="aeroica-welcome__header">
      <div class="aeroica-welcome__logo-wrap">
        <img class="aeroica-welcome__logo" src="${LOGO_PATH}" alt="Aeroica logo">
      </div>

      <div class="aeroica-welcome__heading">
        <div class="aeroica-welcome__eyebrow">
          Aeroica Gaming
        </div>

        <h1 class="aeroica-welcome__title">
          Aeroica's Homebrew VTT - AI Edition
        </h1>

        <div class="aeroica-welcome__meta">
          <span class="aeroica-welcome__badge aeroica-welcome__badge--status">Update Available</span>
          <span class="aeroica-welcome__badge">${currentVersion} → ${remoteVersion}</span>
        </div>
      </div>
    </header>

    <div class="aeroica-welcome__body">

      <p class="aeroica-welcome__lead">
        A newer version of Aeroica's Homebrew VTT - AI Edition is available.
      </p>

      <div class="aeroica-welcome__card">
        <h2 class="aeroica-welcome__section-title">Installed Version</h2>
        <p>${currentVersion}</p>
      </div>

      <div class="aeroica-welcome__card">
        <h2 class="aeroica-welcome__section-title">Latest Available Version</h2>
        <p>${remoteVersion}</p>
      </div>

      <div class="aeroica-welcome__card">
        <h2 class="aeroica-welcome__section-title">Why am I seeing this?</h2>
        <p>
          This AI Edition is installed via manifest URL and does not receive automatic update notifications from the Foundry Marketplace.
        </p>
      </div>

      <div class="aeroica-welcome__card">
        <h2 class="aeroica-welcome__section-title">What should I do?</h2>
        <p>
          Click the button below to open the release page and install the latest version.
        </p>
      </div>

      <p class="aeroica-welcome__footer-note">
        This notification will only appear once per new version.
      </p>

    </div>

  </section>
  `;

  new foundry.applications.api.DialogV2({
    window: {
      title: "Aeroica AI Edition Update Available",
      icon: "fas fa-wand-magic-sparkles"
    },
    position: {
      width: 520,
      height: 760
    },
    content,
    classes: ["aeroica-welcome-dialog"],
    buttons: [
      {
        action: "open",
        icon: "fas fa-download",
        label: "Open Releases",
        callback: () => window.open(RELEASES_URL, "_blank")
      },
      {
        action: "close",
        icon: "fas fa-check",
        label: "Close",
        default: true
      }
    ]
  }).render(true);
}