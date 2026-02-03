import { showHUD, getPreferenceValues, LaunchProps, showToast, Toast, Clipboard } from "@raycast/api";

interface Preferences {
  apiToken: string;
  listId: string;
}

interface Arguments {
  title: string;
}

interface ClickUpTask {
  id: string;
  custom_id: string | null;
  url: string;
  name: string;
  text_content: string | null;
  custom_item_id: number | null;
}

interface ClickUpError {
  err: string;
  ECODE: string;
}

function extractTicketIdFromUrl(url: string): string | null {
  // ClickUp URL format: https://app.clickup.com/t/86xxx or https://app.clickup.com/t/PREFIX-123
  const match = url.match(/\/t\/([A-Za-z0-9-]+)$/);
  return match ? match[1] : null;
}

export default async function Command(props: LaunchProps<{ arguments: Arguments }>) {
  const { title } = props.arguments;
  const { apiToken, listId } = getPreferenceValues<Preferences>();

  if (!title.trim()) {
    await showHUD("❌ Title cannot be empty");
    return;
  }

  try {
    await showToast({
      style: Toast.Style.Animated,
      title: "Creating ticket...",
    });

    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiToken,
      },
      body: JSON.stringify({
        name: title.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as ClickUpError;
      throw new Error(errorData.err || `HTTP ${response.status}`);
    }

    const task = (await response.json()) as ClickUpTask;

    // Try to get the ticket ID from different sources
    // Priority: custom_id > URL extraction > internal id
    let ticketId: string;

    if (task.custom_id) {
      // User-defined custom ID (e.g., CORE-123)
      ticketId = task.custom_id;
    } else {
      // Extract from URL (e.g., /t/86xxx becomes 86xxx)
      const urlId = extractTicketIdFromUrl(task.url);
      ticketId = urlId || task.id;
    }

    // Copy ticket ID to clipboard
    await Clipboard.copy(ticketId);

    await showHUD(`✅ ${ticketId} - copied to clipboard`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await showHUD(`❌ Failed: ${message}`);
  }
}
