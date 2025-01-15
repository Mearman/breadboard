/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as StringsHelper from "../../strings/helper.js";
const Strings = StringsHelper.forSection("UIController");

import {
  BoardServer,
  DataStore,
  EditHistory,
  EditableGraph,
  GraphDescriptor,
  GraphLoader,
  GraphProviderCapabilities,
  GraphProviderExtendedCapabilities,
  InspectableRun,
  InspectableRunEvent,
  InspectableRunInputs,
  Kit,
  MainGraphIdentifier,
  MutableGraphStore,
  RunStore,
} from "@google-labs/breadboard";
import {
  HTMLTemplateResult,
  LitElement,
  PropertyValues,
  html,
  nothing,
} from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { guard } from "lit/directives/guard.js";
import {
  RecentBoard,
  SETTINGS_TYPE,
  STATUS,
  SettingsStore,
  TopGraphRunResult,
  WorkspaceSelectionStateWithChangeId,
  WorkspaceVisualChangeId,
} from "../../types/types.js";
import { styles as uiControllerStyles } from "./ui-controller.styles.js";
import { ModuleEditor } from "../module-editor/module-editor.js";
import { createRef, ref, Ref } from "lit/directives/ref.js";
import { CommandsSetSwitchEvent } from "../../events/events.js";
import {
  COMMAND_SET_GRAPH_EDITOR,
  COMMAND_SET_MODULE_EDITOR,
} from "../../constants/constants.js";
import { Editor } from "../elements.js";
import { classMap } from "lit/directives/class-map.js";
import { map } from "lit/directives/map.js";
import { Sandbox } from "@breadboard-ai/jsandbox";
import { until } from "lit/directives/until.js";

const SIDE_NAV_ITEM_KEY = "bb-ui-side-nav-item";

@customElement("bb-ui-controller")
export class UI extends LitElement {
  @property()
  mainView: "create" | "deploy" = "create";

  @property()
  graph: GraphDescriptor | null = null;

  @property()
  mainGraphId: MainGraphIdentifier | null = null;

  @property()
  editor: EditableGraph | null = null;

  @property()
  runs: InspectableRun[] | null = null;

  @property()
  inputsFromLastRun: InspectableRunInputs | null = null;

  @property()
  boardServerKits: Kit[] = [];

  @property()
  loader: GraphLoader | null = null;

  @property({ reflect: true })
  status = STATUS.RUNNING;

  @property()
  topGraphResult: TopGraphRunResult | null = null;

  @property()
  dataStore: DataStore | null = null;

  @property()
  runStore: RunStore | null = null;

  @property()
  sandbox: Sandbox | null = null;

  @property()
  fileSystem: FileSystem | null = null;

  @property({ reflect: true })
  failedToLoad = false;

  @property()
  readOnly = false;

  @property()
  version = "dev";

  @property()
  recentBoards: RecentBoard[] = [];

  @property()
  settings: SettingsStore | null = null;

  @property()
  boardServers: BoardServer[] = [];

  @property()
  tabURLs: string[] = [];

  @state()
  history: EditHistory | null = null;

  @property()
  mode = "tree" as const;

  @property()
  sideNavItem: string | null = "components";

  @property()
  selectionState: WorkspaceSelectionStateWithChangeId | null = null;

  @property()
  visualChangeId: WorkspaceVisualChangeId | null = null;

  @property()
  graphStore: MutableGraphStore | null = null;

  @property()
  graphTopologyUpdateId: number = 0;

  @property()
  graphStoreUpdateId: number = 0;

  @property()
  showBoardReferenceMarkers = false;

  @state()
  debugEvent: InspectableRunEvent | null = null;

  #lastEventPosition = 0;
  #graphEditorRef: Ref<Editor> = createRef();
  #moduleEditorRef: Ref<ModuleEditor> = createRef();

  static styles = uiControllerStyles;

  connectedCallback(): void {
    super.connectedCallback();

    const sideNavItem = globalThis.localStorage.getItem(SIDE_NAV_ITEM_KEY);
    if (sideNavItem) {
      this.sideNavItem = sideNavItem;
    }
  }

  editorRender = 0;
  protected willUpdate(changedProperties: PropertyValues): void {
    if (changedProperties.has("isShowingBoardActivityOverlay")) {
      this.editorRender++;
    }

    if (changedProperties.has("status")) {
      if (
        changedProperties.get("status") === "stopped" &&
        this.status === "running"
      ) {
        this.sideNavItem = "activity";
      }
    }

    if (changedProperties.has("topGraphResult")) {
      this.#lastEventPosition = 0;
    }

    if (changedProperties.has("selectionState")) {
      // If this is an imperative board with no selection state then set the
      // selection to be the main.
      if (
        this.selectionState?.selectionState.graphs.size === 0 &&
        this.selectionState?.selectionState.modules.size === 0 &&
        this.graph?.main
      ) {
        this.selectionState?.selectionState.modules.add(this.graph.main);
      }

      if (this.#moduleEditorRef.value) {
        if (
          !this.selectionState ||
          this.selectionState.selectionState.modules.size === 0
        ) {
          this.#moduleEditorRef.value.destroyEditor();
        }
      }
    }
  }

  #handleSideNav(label: string) {
    if (this.sideNavItem === "activity") {
      this.#lastEventPosition = this.runs?.[0]?.events.length ?? 0;
    }

    if (this.sideNavItem === label) {
      this.sideNavItem = null;
      globalThis.localStorage.removeItem(SIDE_NAV_ITEM_KEY);
    } else {
      this.sideNavItem = label;
      globalThis.localStorage.setItem(SIDE_NAV_ITEM_KEY, label);
    }
  }

  render() {
    const collapseNodesByDefault = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Collapse Nodes by Default")?.value
      : false;

    const showNodePreviewValues = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show Node Preview Values")?.value
      : false;

    const hideSubboardSelectorWhenEmpty = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Hide Embedded Board Selector When Empty")?.value
      : false;

    const invertZoomScrollDirection = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Invert Zoom Scroll Direction")?.value
      : false;

    const showNodeShortcuts = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show Node Shortcuts")?.value
      : false;

    const showPortTooltips = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show Port Tooltips")?.value
      : false;

    const highlightInvalidWires = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Highlight Invalid Wires")?.value
      : false;

    const showExperimentalComponents = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show Experimental Components")?.value
      : false;

    const showSubgraphsInline = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show subgraphs inline")?.value
      : false;

    const showBoardHierarchy = this.settings
      ? this.settings
          .getSection(SETTINGS_TYPE.GENERAL)
          .items.get("Show board hierarchy")?.value
      : false;

    const graph = this.editor?.inspect("") || null;
    let capabilities: false | GraphProviderCapabilities = false;
    let extendedCapabilities: false | GraphProviderExtendedCapabilities = false;
    for (const boardServer of this.boardServers) {
      if (!this.graph || !this.graph.url) {
        continue;
      }

      const canProvide = boardServer.canProvide(new URL(this.graph.url));
      if (canProvide) {
        capabilities = canProvide;
        extendedCapabilities = boardServer.extendedCapabilities();
        break;
      }
    }

    const canUndo = this.history?.canUndo() ?? false;
    const canRedo = this.history?.canRedo() ?? false;
    const run = this.runs?.[0] ?? null;
    const lastRun = this.runs?.[1] ?? null;
    const events = run?.events ?? [];
    const eventPosition = events.length - 1;

    const appPreview = guard([run, events, eventPosition], () => {
      return html`<bb-app-preview
        .run=${run}
        .events=${events}
        .boardServers=${this.boardServers}
      ></bb-app-preview>`;
    });

    const graphEditor = guard(
      [
        graph,
        run,
        this.boardServerKits,
        this.topGraphResult,
        this.history,
        this.editorRender,
        this.mode,
        this.selectionState,
        this.visualChangeId,
        this.graphTopologyUpdateId,
        this.showBoardReferenceMarkers,
        collapseNodesByDefault,
        hideSubboardSelectorWhenEmpty,
        showNodeShortcuts,
        showNodePreviewValues,
        invertZoomScrollDirection,
        showPortTooltips,
        highlightInvalidWires,
        showExperimentalComponents,
        showSubgraphsInline,
        showBoardHierarchy,
      ],
      () => {
        return html`<bb-editor
          ${ref(this.#graphEditorRef)}
          .canRedo=${canRedo}
          .canUndo=${canUndo}
          .capabilities=${capabilities}
          .collapseNodesByDefault=${collapseNodesByDefault}
          .extendedCapabilities=${extendedCapabilities}
          .graph=${graph}
          .hideSubboardSelectorWhenEmpty=${hideSubboardSelectorWhenEmpty}
          .highlightInvalidWires=${highlightInvalidWires}
          .invertZoomScrollDirection=${invertZoomScrollDirection}
          .readOnly=${this.readOnly}
          .run=${run}
          .showExperimentalComponents=${showExperimentalComponents}
          .showNodePreviewValues=${showNodePreviewValues}
          .showNodeShortcuts=${showNodeShortcuts}
          .showPortTooltips=${showPortTooltips}
          .showSubgraphsInline=${this.mode === "tree"}
          .showReadOnlyOverlay=${true}
          .tabURLs=${this.tabURLs}
          .topGraphResult=${this.topGraphResult}
          .selectionState=${this.selectionState}
          .visualChangeId=${this.visualChangeId}
          .graphTopologyUpdateId=${this.graphTopologyUpdateId}
          .boardServers=${this.boardServers}
          .showBoardReferenceMarkers=${this.showBoardReferenceMarkers}
          @bbrunboard=${() => {
            this.sideNavItem = "activity";
          }}
        ></bb-editor>`;
      }
    );

    const selectedModules = this.selectionState?.selectionState.modules;
    const modules = selectedModules ? [...selectedModules] : [];
    if (modules.length > 0) {
      // TODO.
    }

    let moduleEditor: HTMLTemplateResult | symbol = nothing;
    if (graph && selectedModules && selectedModules.size > 0) {
      moduleEditor = html`<bb-module-editor
        ${ref(this.#moduleEditorRef)}
        .canRedo=${canRedo}
        .canUndo=${canUndo}
        .capabilities=${capabilities}
        .graph=${graph}
        .moduleId=${modules[0]}
        .modules=${graph.modules() ?? {}}
        .readOnly=${this.readOnly}
        .renderId=${crypto.randomUUID()}
        .run=${run}
        .topGraphResult=${this.topGraphResult}
        .graphStore=${this.graphStore}
        @bbrunboard=${() => {
          this.sideNavItem = "activity";
        }}
      ></bb-module-editor>`;
    }

    let chosenSideNavItem = this.sideNavItem;
    // Ensure components & capabilities only apply when the view is of the
    // correct type.
    const selectedModuleCount =
      this.selectionState?.selectionState.modules.size ?? 0;
    if (this.sideNavItem === "components" && selectedModuleCount > 0) {
      chosenSideNavItem = null;
    }

    if (this.sideNavItem === "capabilities" && selectedModuleCount === 0) {
      chosenSideNavItem = null;
    }

    const sectionNavItems = [
      { item: "activity", label: "LABEL_SECTION_NAV_ACTIVITY" },
      { item: "workspace-overview", label: "LABEL_SECTION_NAV_PROJECT" },
    ];

    if (modules.length > 0) {
      sectionNavItems.unshift({
        item: "capabilities",
        label: "LABEL_SECTION_NAV_CAPABILITIES",
      });
    } else {
      sectionNavItems.unshift({
        item: "components",
        label: "LABEL_SECTION_NAV_COMPONENTS",
      });
    }

    const sectionNav = html`<div id="section-nav">
      ${map(sectionNavItems, ({ item, label }) => {
        const newEventCount = events.length - this.#lastEventPosition;
        return html`<button
          id="toggle-${item}"
          ?disabled=${chosenSideNavItem === item}
          data-count=${item === "activity" &&
          chosenSideNavItem !== "activity" &&
          newEventCount > 0
            ? newEventCount
            : nothing}
          class=${classMap({ active: chosenSideNavItem === item })}
          @click=${() => {
            this.#handleSideNav(item);
          }}
        >
          ${Strings.from(label)}
        </button>`;
      })}
    </div> `;

    const contentContainer = html`<div id="graph-container" slot="slot-1">
      ${graphEditor} ${modules.length > 0 ? moduleEditor : nothing}
    </div>`;

    let sideNavItem: HTMLTemplateResult | symbol = nothing;
    switch (this.sideNavItem) {
      case "workspace-overview": {
        sideNavItem = html` ${guard(
          [
            graph,
            this.mode,
            this.selectionState,
            this.graphStoreUpdateId,
            this.showBoardReferenceMarkers,
          ],
          () => {
            return html`<bb-workspace-outline
              .graph=${graph}
              .renderId=${globalThis.crypto.randomUUID()}
              .mode=${this.mode}
              .selectionState=${this.selectionState}
              .graphStoreUpdateId=${this.graphStoreUpdateId}
              .showBoardReferenceMarkers=${this.showBoardReferenceMarkers}
              @bbdragconnectorstart=${() => {
                this.showBoardReferenceMarkers = true;
              }}
            ></bb-workspace-outline>`;
          }
        )}`;
        break;
      }

      case "capabilities": {
        sideNavItem = html` <bb-capabilities-selector></bb-capabilities-selector>`;
        break;
      }

      case "components": {
        sideNavItem = html`${guard(
          [this.boardServerKits, this.graphStoreUpdateId, this.mainGraphId],
          () =>
            html` <bb-component-selector
              .graphStoreUpdateId=${this.graphStoreUpdateId}
              .showExperimentalComponents=${showExperimentalComponents}
              .boardServerKits=${this.boardServerKits}
              .graphStore=${this.graphStore}
              .mainGraphId=${this.mainGraphId}
            ></bb-component-selector>`
        )}`;
        break;
      }

      case "activity": {
        const latest = events.at(-1);
        let showDebugControls = false;
        if (latest && latest.type === "node") {
          showDebugControls = this.status === "stopped" && latest.end === null;
        }

        const hideLast = this.status === STATUS.STOPPED;
        const inputsFromLastRun = lastRun?.inputs() ?? null;
        const nextNodeId =
          this.topGraphResult?.currentNode?.descriptor.id ?? null;

        sideNavItem = html`${guard(
          [run, events, eventPosition, this.debugEvent],
          () =>
            html` <div id="board-activity-container">
              <bb-board-activity
                class=${classMap({ collapsed: this.debugEvent !== null })}
                .run=${run}
                .events=${events}
                .eventPosition=${eventPosition}
                .inputsFromLastRun=${inputsFromLastRun}
                .showExtendedInfo=${true}
                .settings=${this.settings}
                .showLogTitle=${false}
                .logTitle=${"Run"}
                .hideLast=${hideLast}
                .boardServers=${this.boardServers}
                .showDebugControls=${showDebugControls}
                .nextNodeId=${nextNodeId}
                @pointerdown=${(evt: PointerEvent) => {
                  const [top] = evt.composedPath();
                  if (!(top instanceof HTMLElement) || !top.dataset.messageId) {
                    return;
                  }
                  evt.stopImmediatePropagation();
                  const id = top.dataset.messageId;
                  const event = run?.getEventById(id);
                  if (!event) {
                    // TODO: Offer the user more information.
                    console.warn(`Unable to find event with ID "${id}"`);
                    return;
                  }
                  if (event.type !== "node") {
                    return;
                  }

                  this.debugEvent = event;
                }}
                name=${Strings.from("LABEL_PROJECT")}
              ></bb-board-activity>
              ${this.debugEvent
                ? html`<bb-event-details
                    .event=${this.debugEvent}
                  ></bb-event-details>`
                : nothing}
            </div>`
        )}`;
        break;
      }
    }

    const previewUrl: Promise<URL | null> = new Promise<BoardServer | null>(
      (resolve) => {
        if (!this.graph) {
          resolve(null);
          return;
        }

        const boardServer = this.boardServers.find((boardServer) => {
          if (!this.graph || !this.graph.url) {
            return null;
          }

          return boardServer.canProvide(new URL(this.graph.url));
        });

        resolve(boardServer ?? null);
      }
    ).then((boardServer: BoardServer | null) => {
      if (!boardServer || !this.graph || !this.graph.url) {
        return null;
      }

      return boardServer.preview(new URL(this.graph.url));
    });

    return graph
      ? html`<section id="create-view">
            <bb-splitter
              id="splitter"
              split="[0.2, 0.8]"
              .name=${"create-view"}
              .minSegmentSizeHorizontal=${265}
            >
              <div id="create-view-sidenav" slot="slot-0">
                ${sectionNav}
                ${this.debugEvent !== null
                  ? html`<button
                      id="back-to-activity"
                      @click=${() => {
                        this.debugEvent = null;
                      }}
                    >
                      ${Strings.from("COMMAND_BACK_TO_ACTIVITY")}
                    </button>`
                  : nothing}
                ${sideNavItem}
              </div>
              ${contentContainer}
            </bb-splitter>
          </section>

          ${this.mainView === "create"
            ? nothing
            : html`
                <section id="deploy-view">
                  <bb-splitter
                    id="splitter"
                    split="[0.2, 0.8]"
                    .name=${"deploy-view"}
                    .minSegmentSizeHorizontal=${265}
                  >
                    <div id="deploy-view-sidenav" slot="slot-0">
                      <div class="deploy-option layout">
                        <label>${Strings.from("LABEL_APP_LAYOUT")}</label>
                        <p>${Strings.from("LABEL_APP_LAYOUT_DESCRIPTION")}</p>
                        <select>
                          <option>${Strings.from("LABEL_TEMPLATE_1")}</option>
                          <option>${Strings.from("LABEL_TEMPLATE_2")}</option>
                          <option>${Strings.from("LABEL_TEMPLATE_3")}</option>
                        </select>
                      </div>

                      <div class="deploy-option public">
                        <label>${Strings.from("LABEL_PUBLIC")}</label>
                        <input id="visibility" type="checkbox" checked />
                        <label for="visibility" id="visibility-status"
                          >Status</label
                        >
                      </div>

                      <div class="deploy-option share">
                        <label>${Strings.from("LABEL_SHARE")}</label>
                        <p>${Strings.from("LABEL_SHARE_DESCRIPTION")}</p>
                        <div class="deploy-share-url">
                          <span class="url"
                            >${until(previewUrl, html`Loading URL...`)}</span
                          >
                          <button>Copy to Clipboard</button>
                        </div>
                      </div>
                    </div>
                    <div id="deploy" slot="slot-1">${appPreview}</div>
                  </bb-splitter>
                </section>
              `}`
      : html`<section id="content" class="welcome">${graphEditor}</section>`;
  }

  updated() {
    // Inform bb-main which command set is in use.
    const selectedModules = this.selectionState?.selectionState.modules;
    const modules = selectedModules ? [...selectedModules] : [];

    this.dispatchEvent(
      new CommandsSetSwitchEvent(
        modules.length > 0
          ? COMMAND_SET_MODULE_EDITOR
          : COMMAND_SET_GRAPH_EDITOR
      )
    );
  }
}
