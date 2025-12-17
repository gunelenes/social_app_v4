import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export const downloadAndShareFile = async (
  url: string,
  filename: string
) => {
  try {
    const fileUri = FileSystem.documentDirectory + filename;

    const result = await FileSystem.downloadAsync(url, fileUri);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri);
    }
  } catch (err) {
    console.error("Dosya indirme hatası:", err);
  }
};
