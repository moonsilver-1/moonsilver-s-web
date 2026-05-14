import rawData from "./career_game_data.json";

export const CAREER_GAME_DATA = rawData;

export const DIMENSION_ORDER = ["AR", "PD", "XS", "LM"] as const;

export type DimensionCode = (typeof DIMENSION_ORDER)[number];

export type CareerType = (typeof CAREER_GAME_DATA.career_types)[number];
export type QuestionItem = (typeof CAREER_GAME_DATA.question_bank)[number];
export type AbilityItem = (typeof CAREER_GAME_DATA.abilities)[number];
export type JobItem = (typeof CAREER_GAME_DATA.jobs)[number];
export type JobTypeMapItem = (typeof CAREER_GAME_DATA.job_type_map)[number];
export type JobAbilityMapItem = (typeof CAREER_GAME_DATA.job_ability_map)[number];

export type NormalizedQuestion = QuestionItem & {
  index: number;
  dimensionIndex: number;
};

export type NormalizedJob = JobItem & {
  coreAbilityIds: string[];
  coreAbilityNamesList: string[];
  altCodesList: string[];
};

export type DimensionMeta = (typeof CAREER_GAME_DATA.dimensions)[number];

export const systemOverview = CAREER_GAME_DATA.system_overview;
export const dimensions = CAREER_GAME_DATA.dimensions as DimensionMeta[];
export const letters = CAREER_GAME_DATA.letters;
export const careerTypes = CAREER_GAME_DATA.career_types as CareerType[];
export const questionBank = CAREER_GAME_DATA.question_bank as QuestionItem[];
export const abilities = CAREER_GAME_DATA.abilities as AbilityItem[];
export const jobs = CAREER_GAME_DATA.jobs as JobItem[];
export const jobTypeMap = CAREER_GAME_DATA.job_type_map as JobTypeMapItem[];
export const jobAbilityMap = CAREER_GAME_DATA.job_ability_map as JobAbilityMapItem[];

export const questionGroups = DIMENSION_ORDER.map((dimension) => ({
  dimension,
  questions: questionBank.filter((question) => question.dimension === dimension),
}));

export const careerTypeByCode = new Map(
  careerTypes.map((careerType) => [careerType.career_code, careerType] as const),
);

export const jobById = new Map(
  jobs.map((job) => [job.job_id, job] as const),
);

export const abilityById = new Map(
  abilities.map((ability) => [ability.ability_id, ability] as const),
);

export const jobTypeRankByKey = new Map(
  jobTypeMap.map((entry) => [`${entry.job_id}:${entry.career_code}`, entry.rank] as const),
);

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const normalizedJobs: NormalizedJob[] = jobs.map((job) => ({
  ...job,
  coreAbilityIds: splitList(job.core_ability_ids),
  coreAbilityNamesList: splitList(job.core_ability_names),
  altCodesList: splitList(job.alt_codes),
}));

export const normalizedQuestions: NormalizedQuestion[] = questionBank.map((question, index) => ({
  ...question,
  index,
  dimensionIndex: DIMENSION_ORDER.indexOf(question.dimension as DimensionCode),
}));

export function getCareerTypeByCode(careerCode: string) {
  return careerTypeByCode.get(careerCode);
}

export function getJobById(jobId: string) {
  return jobById.get(jobId);
}

export function getAbilityById(abilityId: string) {
  return abilityById.get(abilityId);
}
