interface Build {
  name: string;
  description: string;
  weapon_1: string;
  weapon_2: string;
  set_1: string;
  set2_1: string;
  stats: string[];
}

export interface SkillModifier {
  stat: string;
  value: string;
}

export interface Skill {
  id: string;
  name: string;
  type: string;
  description: string;
  modifiers: SkillModifier[];
}

export interface Passive {
  id: string;
  name: string;
  unlock?: string;
  description: string;
}

export function instanceOfSkill(data: any): data is Skill {
  return "modifiers" in data;
}

export interface Constellation {
  id: string;
  name: string;
  description: string;
  level: number;
}

export interface AscensionMaterial {
  id: string;
  name: string;
  amount: number;
}

export interface Ascension {
  ascension: number;
  level: number;
  cost: number;
  mat1: AscensionMaterial;
  mat2?: AscensionMaterial;
  mat3: AscensionMaterial;
  mat4: AscensionMaterial;
}

export interface Character {
  id: string;
  name: string;
  region: string;
  description: string;
  location: string;
  rarity: number;
  element: string;
  weapon_type: string;
  gender: string;
  titles: string[];
  builds?: Build[];
  skills?: Skill[];
  passives?: Passive[];
  constellations?: Constellation[];
  ascension?: Ascension[];
}

export interface Weapon {
  id: string;
  name: string;
  description: string;
  location: string;
  type: string;
  rarity: number;
  base: number;
  secondary?: string;
  passive: string;
  bonus?: string;
  series?: string;
}

interface ArtifactSet {
  name: string;
  description: string;
}

export interface Artifact {
  id: string;
  name: string;
  min_rarity: number;
  max_rarity: number;
  flower?: ArtifactSet;
  plume?: ArtifactSet;
  sands?: ArtifactSet;
  goblet?: ArtifactSet;
  circlet?: ArtifactSet;
  "1pc"?: string;
  "2pc"?: string;
  "4pc"?: string;
  drop: Record<string, string[]>;
}

export interface GemQuality {
  id: string;
  name: string;
  description: string;
  craft?: {
    name: string;
    amount: number;
  };
  rarity: number;
  sources: string[];
}

export interface GemsMaterial {
  id: string;
  name: string;
  material_type: string[];
  quality: GemQuality[];
}

export interface Material {
  id: string;
  name: string;
  type: string;
  rarity?: number;
  material_type: string[];
  description: string;
  location?: string;
  sources?: string[];
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]> | T[P];
};
