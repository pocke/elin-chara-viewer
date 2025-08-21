import { z } from 'zod';

export const ElementSchema = z.object({
  __meta: z.object({
    defaultSortKey: z.number(),
  }),
  id: z.string(),
  alias: z.string().optional(),
  name_JP: z.string().optional(),
  name: z.string().optional(),
  altname_JP: z.string().optional(),
  altname: z.string().optional(),
  aliasParent: z.string().optional(),
  aliasRef: z.string().optional(),
  aliasMtp: z.string().optional(),
  parentFactor: z.coerce.number().optional(),
  lvFactor: z.coerce.number().optional(),
  encFactor: z.coerce.number().optional(),
  encSlot: z.string().optional(),
  mtp: z.coerce.number().optional(),
  LV: z.coerce.number().optional(),
  chance: z.coerce.number().optional(),
  value: z.coerce.number().optional(),
  cost: z.string().optional(),
  geneSlot: z.coerce.number().optional(),
  sort: z.coerce.number().optional(),
  target: z.string().optional(),
  proc: z.string().optional(),
  type: z.string().optional(),
  group: z.string().optional(),
  category: z.string().optional(),
  categorySub: z.string().optional(),
  abilityType: z.string().optional(),
  tag: z.string().optional(),
  thing: z.string().optional(),
  eleP: z.coerce.number().optional(),
  cooldown: z.coerce.number().optional(),
  charge: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  req: z.string().optional(),
  idTrainer: z.string().optional(),
  partySkill: z.coerce.number().optional(),
  tagTrainer: z.string().optional(),
  levelBonus_JP: z.string().optional(),
  levelBonus: z.string().optional(),
  foodEffect: z.string().optional(),
  '***': z.string().optional(),
  langAct: z.string().optional(),
  detail_JP: z.string().optional(),
  detail: z.string().optional(),
  textPhase_JP: z.string().optional(),
  textPhase: z.string().optional(),
  textExtra_JP: z.string().optional(),
  textExtra: z.string().optional(),
  textInc_JP: z.string().optional(),
  textInc: z.string().optional(),
  textDec_JP: z.string().optional(),
  textDec: z.string().optional(),
  textAlt_JP: z.string().optional(),
  textAlt: z.string().optional(),
  adjective_JP: z.string().optional(),
  adjective: z.string().optional(),
});

export type ElementRow = z.infer<typeof ElementSchema>;

export type ElementAttacks =
  | 'eleFire'
  | 'eleCold'
  | 'eleLightning'
  | 'eleDarkness'
  | 'eleMind'
  | 'elePoison'
  | 'eleNether'
  | 'eleSound'
  | 'eleNerve'
  | 'eleHoly'
  | 'eleChaos'
  | 'eleMagic'
  | 'eleEther'
  | 'eleAcid'
  | 'eleCut'
  | 'eleImpact'
  | 'eleVoid';

export class Element {
  constructor(private row: ElementRow) {}

  get id() {
    return this.row.id;
  }

  get defaultSortKey() {
    return this.row.__meta.defaultSortKey;
  }

  name(locale: string) {
    return locale === 'ja' ? this.row.name_JP : this.row.name;
  }
}
