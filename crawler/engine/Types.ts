interface Build {
  name: string;
  description: string;
  weapon_1: string;
  weapon_2: string;
  set_1: string;
  set2_1: string;
  stats: string[];
}

interface SkillModifier {
  stat: string;
  value: string;
}

interface Skill {
  name: string;
  icon: boolean;
  type: string;
  description: string;
  modifiers: SkillModifier[];
}

interface Passive {
  name: string;
  icon: boolean;
  unlock?: string;
  description: string;
}

interface Constellation {
  name: string;
  icon: boolean;
  description: string;
}

export interface Character {
  // name: string;
  // id: number;
  tier: number;
  tier_overall: number;
  tier_exploration: number;
  tier_bosses: number;
  tier_dungeons: number;
  tier_abyss: number;
  role: string;
  soon: boolean;
  new: boolean;
  // region: string;
  description: string;
  location: string;
  // rarity: number;
  // type: string;
  // weapon: string;
  asc_stat: string;
  builds?: Build[];
  skills?: Skill[];
  passives?: Passive[];
  constellations?: Constellation[];
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
