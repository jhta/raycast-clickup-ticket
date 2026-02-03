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
  custom_item_id: number | null;
  space: {
    id: string;
  };
}

interface ClickUpList {
  id: string;
  name: string;
  space: {
    id: string;
    name: string;
  };
}

interface ClickUpSpace {
  id: string;
  name: string;
  features: {
    custom_items?: {
      enabled: boolean;
    };
  };
}

interface ClickUpError {
  err: string;
  ECODE: string;
}

async function getListDetails(listId: string, apiToken: string): Promise<ClickUpList | null> {
  try {
    const response = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, {
      method: "GET",
      headers: { Authorization: apiToken },
    });
    if (response.ok) {
      return (await response.json()) as ClickUpList;
    }
  } catch {
    // Ignore
  }
  return null;
}

async function getTaskDetails(taskId: string, apiToken: string): Promise<{ custom_item_id?: number } | null> {
  try {
    const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}?include_subtasks=false`, {
      method: "GET",
      headers: { Authorization: apiToken },
    });
    if (response.ok) {
      return (await response.json()) as { custom_item_id?: number };
    }
  } catch {
    // Ignore
  }
  return null;
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

    // Create the task
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

    // Get the formatted ticket ID (e.g., CORE-1234)
    let ticketId: string = task.id;

    // Fetch task details to get custom_item_id (the number part)
    const taskDetails = await getTaskDetails(task.id, apiToken);
    const customItemId = taskDetails?.custom_item_id || task.custom_item_id;

    if (customItemId) {
      // Get list details to find the space name (used as prefix)
      const listDetails = await getListDetails(listId, apiToken);
      
      if (listDetails?.space?.name) {
        // Format: SPACENAME-NUMBER (e.g., CORE-1234)
        ticketId = `${listDetails.space.name}-${customItemId}`;
      } else {
        ticketId = `#${customItemId}`;
      }
    }

    // Copy ticket ID to clipboard
    await Clipboard.copy(ticketId);

    await showHUD(`✅ ${ticketId} - copied to clipboard`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await showHUD(`❌ Failed: ${message}`);
  }
}
