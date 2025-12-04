/**
 * Converts a Base64 string to a Blob
 */
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
};

/**
 * Posts a photo with a caption to a Telegram Chat/Channel
 */
export const postToTelegram = async (
  botToken: string,
  chatId: string,
  imageBase64: string,
  caption: string
): Promise<any> => {
  if (!botToken || !chatId) {
    throw new Error("Bot Token and Chat ID are required.");
  }

  const blob = base64ToBlob(imageBase64);
  const formData = new FormData();
  
  formData.append('chat_id', chatId);
  formData.append('caption', caption);
  formData.append('parse_mode', 'HTML');
  formData.append('photo', blob, 'generated-fact.jpg');

  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || "Unknown Telegram API error");
    }

    return data;
  } catch (error) {
    console.error("Telegram Post Error:", error);
    throw error;
  }
};

/**
 * Fetches recent updates from the bot to find new users/chats
 */
export const getBotUpdates = async (botToken: string): Promise<any[]> => {
  const url = `https://api.telegram.org/bot${botToken}/getUpdates`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.description || "Failed to fetch updates");
    }
    
    return data.result || [];
  } catch (error) {
    console.error("Fetch Updates Error:", error);
    throw error;
  }
};