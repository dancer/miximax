import jpNamesData from "@/data/jp_names.json";

const nameMap = new Map<string, string>();

jpNamesData.forEach((entry) => {
  if (entry.dub_name && entry.roma_name) {
    nameMap.set(entry.dub_name.toLowerCase(), entry.roma_name);
  }
});

export function getJpName(englishName: string): string {
  return nameMap.get(englishName.toLowerCase()) || englishName;
}
