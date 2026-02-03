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
  name: string;
  url: string;
}

interface ClickUpError {
  err: string;
  ECODE: string;
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
    const createResponse = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiToken,
      },
      body: JSON.stringify({
        name: title.trim(),
      }),
    });

    if (!createResponse.ok) {
      const errorData = (await createResponse.json()) as ClickUpError;
      throw new Error(errorData.err || `HTTP ${createResponse.status}`);
    }

    const createdTask = (await createResponse.json()) as ClickUpTask;

    // Fetch task details to get the custom_id (e.g., CORE-1238)
    const getResponse = await fetch(`https://api.clickup.com/api/v2/task/${createdTask.id}`, {
      method: "GET",
      headers: { Authorization: apiToken },
    });

    let ticketId = createdTask.id;

    if (getResponse.ok) {
      const taskDetails = (await getResponse.json()) as ClickUpTask;
      // Use custom_id if available (e.g., CORE-1238)
      if (taskDetails.custom_id) {
        ticketId = taskDetails.custom_id;
      }
    }

    // Copy ticket ID to clipboard
    await Clipboard.copy(ticketId);

    await showHUD(`✅ ${ticketId} copied`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await showHUD(`❌ Failed: ${message}`);
  }
}
