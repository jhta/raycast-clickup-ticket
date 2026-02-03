/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** ClickUp API Token - Your ClickUp API token */
  "apiToken": string,
  /** List ID - The ClickUp list ID where tickets will be created */
  "listId": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-ticket` command */
  export type CreateTicket = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-ticket` command */
  export type CreateTicket = {
  /** Ticket title */
  "title": string
}
}

