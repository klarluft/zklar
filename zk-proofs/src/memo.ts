import path from "path";
import fs from "fs";

export async function memo<T>(key: string, fallback: () => Promise<T>): Promise<T> {
  // if (process.env.NODE_ENV !== "development") return fallback();

  const filePath = path.join(__dirname, "memo", `temp_${key}.json`);

  try {
    const fileContent = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(fileContent) as T;
    console.log("hit", key);
    return data;
  } catch (_) {
    console.log("miss", key);
    const data = await fallback();
    const fileContent = JSON.stringify(data);
    await fs.promises.writeFile(filePath, fileContent, "utf-8");
    return data;
  }
}
