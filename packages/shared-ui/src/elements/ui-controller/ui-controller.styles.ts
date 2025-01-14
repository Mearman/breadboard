/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { css } from "lit";

export const styles = css`
  * {
    box-sizing: border-box;
  }

  :host {
    display: grid;
    height: 100%;
    overscroll-behavior: contain;
    overflow: auto;
    color: var(--bb-neutral-900);
  }

  #controls-activity,
  #create-view {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: relative;
  }

  #create-view {
    display: grid;
    grid-template-columns: 1fr;
    &.welcome {
      grid-template-columns: none;
    }
  }

  #deploy-view {
    width: 100%;
    height: 100%;
    overflow: auto;
    position: absolute;
    top: 0;
    left: 0;
    background: var(--bb-neutral-0);
    z-index: 2;

    & #deploy-view-sidenav {
      background: var(--bb-neutral-0);
      border-right: 1px solid var(--bb-neutral-300);
    }

    & bb-app-preview {
      position: relative;
      width: 100%;
      height: 100%;
      z-index: 2;
    }

    & #no-items {
      font: 400 var(--bb-body-small) / var(--bb-body-line-height-small)
        var(--bb-font-family);
      color: var(--bb-neutral-700);
      padding: var(--bb-grid-size-4);
    }
  }

  #controls-activity {
    display: grid;
    grid-auto-rows: 1fr calc(var(--bb-grid-size) * 14);
    background: var(--bb-neutral-0);
  }

  #controls-activity-content {
    width: 100%;
    height: 100%;
    overflow-x: hidden;
    overflow-y: scroll;
    scrollbar-gutter: stable;
  }

  #stop {
    background: var(--bb-neutral-0) var(--bb-icon-stop-circle) center center /
      24px 24px no-repeat;
    height: 32px;
    width: 32px;
    font-size: 0;
    border: none;
    cursor: pointer;
  }

  #stop[disabled] {
    opacity: 0.4;
    cursor: auto;
  }

  #controls {
    border-top: 1px solid var(--bb-neutral-300);
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: calc(var(--bb-grid-size) * 3);
    font-size: var(--bb-label-large);
  }

  #controls {
    display: flex;
  }

  #value {
    padding: 0 calc(var(--bb-grid-size) * 2);
    display: flex;
    background: #d1cbff;
    border-radius: calc(var(--bb-grid-size) * 3);
    font-size: var(--bb-text-small);
    font-weight: bold;
    height: calc(var(--bb-grid-size) * 5);
    align-items: center;
    justify-content: center;
    margin-left: calc(var(--bb-grid-size) * 2);
    margin-top: calc(var(--bb-grid-size) * -0.5);
  }

  #max {
    font-size: var(--bb-text-pico);
    font-weight: normal;
  }

  #details {
    display: block;
    position: absolute;
    z-index: 100;
    background: var(--bb-neutral-0);
    padding: 10px;
    width: 90%;
    max-width: 35vw;
    height: calc(100svh - 220px);
    top: 90px;
    right: 10px;
    border: 1px solid #d9d9d9;
    border-radius: calc(var(--bb-grid-size) * 2);
    overflow-y: scroll;
    box-shadow:
      0px 1px 2px rgba(0, 0, 0, 0.3),
      0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  }

  #details.portrait {
    bottom: 10px;
    max-width: 55vw;
    right: auto;
    height: calc(100% - 20px);
    top: auto;
    left: 10px;
  }

  .failed-to-load {
    background: var(--bb-neutral-100);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .failed-to-load h1 {
    margin: 0 0 calc(var(--bb-grid-size) * 2) 0;
    font-size: var(--bb-title-large);
    font-weight: 500;
    color: var(--bb-neutral-800);
  }

  .failed-to-load p {
    margin: 0;
    font-size: var(--bb-label-medium);
    font-weight: 400;
    color: var(--bb-neutral-500);
  }

  .failed-to-load h1,
  .failed-to-load p {
    width: 80vw;
    max-width: 320px;
    text-align: center;
  }

  bb-activity-log-lite {
    padding: 0 var(--bb-grid-size-4) var(--bb-grid-size-10)
      var(--bb-grid-size-4);
  }

  bb-module-editor {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    background: var(--bb-ui-50);
  }

  #create-view-sidenav {
    border-right: 1px solid var(--bb-neutral-300);
  }

  #create-view-sidenav,
  #graph-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }

  bb-workspace-outline,
  bb-graph-renderer {
    display: block;
    width: 100%;
    height: 100%;
    outline: none;
    overflow: hidden;
  }

  #splitter {
    height: 100%;
    width: 100%;
  }

  #side-nav-title {
    height: var(--bb-grid-size-11);
    margin: 0;
    display: flex;
    align-items: center;
    padding: var(--bb-grid-size-2);
    font: 500 var(--bb-label-large) / var(--bb-label-line-height-large)
      var(--bb-font-family);
    border-bottom: 1px solid var(--bb-neutral-300);
    justify-content: space-between;
  }

  #side-nav {
    background: var(--bb-neutral-600);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 2;
  }

  #side-nav-top {
    padding: var(--bb-grid-size-2);
  }

  #side-nav-top > * {
    margin-top: var(--bb-grid-size);
  }

  #side-nav-top > *:first-of-type {
    margin-top: 0;
  }

  #create-new {
    height: var(--bb-grid-size-7);
    border: none;
    background: transparent var(--bb-icon-add-circle) var(--bb-grid-size)
      center / 20px 20px no-repeat;
    margin: 0 0 0 var(--bb-grid-size-2);
    opacity: 0.7;
    cursor: pointer;
    border-radius: var(--bb-grid-size-12);
    transition: opacity 0.1s cubic-bezier(0, 0, 0.3, 1);
    padding: 0 var(--bb-grid-size-2) 0 var(--bb-grid-size-7);
    font: 400 var(--bb-label-small) / var(--bb-label-line-height-small)
      var(--bb-font-family);
  }

  #create-new:hover,
  #create-new:focus {
    background-color: var(--bb-neutral-50);
    opacity: 1;
  }

  #section-nav {
    height: var(--bb-grid-size-14);
    border-bottom: 1px solid var(--bb-neutral-300);
    display: flex;
    align-items: flex-end;
    justify-content: center;

    & button {
      padding: var(--bb-grid-size-6) var(--bb-grid-size) var(--bb-grid-size-2)
        var(--bb-grid-size);
      border: none;
      position: relative;
      margin: 0 var(--bb-grid-size-2);
      font: 400 var(--bb-label-small) / var(--bb-label-line-height-small)
        var(--bb-font-family);
      color: var(--bb-neutral-900);

      &[disabled] {
        opacity: 1;
        color: var(--bb-ui-500);

        &::after {
          content: "";
          position: absolute;
          height: 3px;
          width: 100%;
          bottom: 0;
          left: 0;
          border-radius: var(--bb-grid-size) var(--bb-grid-size) 0 0;
          background: var(--bb-ui-500);
        }
      }

      &:not([disabled]) {
        cursor: pointer;

        &:hover {
          color: var(--bb-ui-700);
        }
      }
    }
  }

  #toggle-components {
    background: var(--bb-icon-extension) center 4px / 20px 20px no-repeat;
  }

  #toggle-activity {
    background: var(--bb-icon-vital-signs) center 4px / 20px 20px no-repeat;
  }

  #toggle-workspace-overview {
    background: transparent var(--bb-icon-workspace) center 4px / 20px 20px
      no-repeat;
  }

  #toggle-capabilities {
    background: transparent var(--bb-icon-capabilities) center 4px / 20px 20px
      no-repeat;
  }

  #toggle-activity[data-count]::before {
    content: attr(data-count);
    position: absolute;
    top: -6px;
    right: -6px;
    width: 18px;
    height: 18px;
    background: var(--bb-notify-500);
    color: var(--bb-neutral-0);
    border-radius: 50%;
    font: 400 var(--bb-body-x-small) / var(--bb-body-line-height-x-small)
      var(--bb-font-family);
    z-index: 100;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  #board-activity-container {
    height: calc(100% - 64px);
    overflow: auto;
    position: relative;
    padding: var(--bb-grid-size-2);
  }

  bb-activity-log.collapsed {
    overflow: hidden;
    height: 0;
  }

  bb-event-details {
    background: var(--bb-neutral-0);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    min-height: 100%;
    z-index: 1;
    padding: var(--bb-grid-size-4);
  }

  #back-to-activity {
    background: var(--bb-ui-50) var(--bb-icon-arrow-back) 6px center / 20px 20px
      no-repeat;
    border: none;
    font: 400 var(--bb-body-small) / var(--bb-body-line-height-small)
      var(--bb-font-family);
    color: var(--bb-ui-600);
    padding: var(--bb-grid-size) var(--bb-grid-size-4) var(--bb-grid-size)
      var(--bb-grid-size-8);
    margin-right: var(--bb-grid-size-2);
    border-radius: 50px;
    cursor: pointer;
    transition: background-color 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  #back-to-activity:hover,
  #back-to-activity:focus {
    background-color: var(--bb-ui-100);
  }
`;
