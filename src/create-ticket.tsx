import { showHUD, getPreferenceValues, LaunchProps, showToast, Toast, open } from "@raycast/api";

interface Preferences {
  apiToken: string;
  listId: string;
}

interface Arguments {
  title: string;
}

interface ClickUpTask {
  id: string;
  url: string;
  name: string;
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

    await showHUD(`✅ Created: ${task.name}`);

    // Optionally open the task in browser
    // await open(task.url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await showHUD(`❌ Failed: ${message}`);
  }
}
