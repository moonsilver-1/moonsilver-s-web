import {
  careerTypes,
  getAbilityById,
  getCareerTypeByCode,
  jobTypeRankByKey,
  normalizedJobs,
  normalizedQuestions,
  type CareerType,
  type DimensionCode,
  type NormalizedJob,
  type NormalizedQuestion,
} from "@/app/fun/jobti/jobti-data";

export type DimensionResult = {
  dimension: DimensionCode;
  leftLetter: string;
  rightLetter: string;
  leftName: string;
  rightName: string;
  leftScore: number;
  rightScore: number;
  normalized: number;
  pickedLetter: string;
};

export type JobMatch = {
  job: NormalizedJob;
  fitScore: number;
  distance: number;
  codeBonus: number;
  rankBonus: number;
};

export type JobtiResult = {
  typeCode: string;
  careerType: CareerType;
  dimensions: DimensionResult[];
  jobs: JobMatch[];
  topAbilities: Array<{ id: string; name: string; count: number }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getAnswer(answers: Array<number | null>, index: number) {
  const value = answers[index];
  return typeof value === "number" && value >= 1 && value <= 5 ? value : null;
}

function scoreDimension(
  dimension: DimensionCode,
  leftLetter: string,
  rightLetter: string,
  leftName: string,
  rightName: string,
  questions: NormalizedQuestion[],
  answers: Array<number | null>,
) {
  let leftRaw = 0;
  let rightRaw = 0;
  let answered = 0;

  questions.forEach((question) => {
    const value = getAnswer(answers, question.index);
    if (value === null) {
      return;
    }

    leftRaw += 6 - value;
    rightRaw += value;
    answered += 1;
  });

  const leftScore = answered === 0 ? 50 : Math.round(((leftRaw - answered) / (4 * answered)) * 100);
  const rightScore = answered === 0 ? 50 : Math.round(((rightRaw - answered) / (4 * answered)) * 100);
  const normalized = clamp(leftScore, 0, 100);

  return {
    dimension,
    leftLetter,
    rightLetter,
    leftName,
    rightName,
    leftScore: clamp(leftScore, 0, 100),
    rightScore: clamp(rightScore, 0, 100),
    normalized,
    pickedLetter: normalized >= 50 ? leftLetter : rightLetter,
  };
}

function getDimensionMeta(dimension: DimensionCode) {
  const questions = normalizedQuestions.filter((question) => question.dimension === dimension);

  if (dimension === "AR") {
    return {
      questions,
      left: { letter: "A", name: "创意表达" },
      right: { letter: "R", name: "规则构建" },
    };
  }

  if (dimension === "PD") {
    return {
      questions,
      left: { letter: "P", name: "人群协同" },
      right: { letter: "D", name: "数据驱动" },
    };
  }

  if (dimension === "XS") {
    return {
      questions,
      left: { letter: "X", name: "探索开拓" },
      right: { letter: "S", name: "稳定落地" },
    };
  }

  return {
    questions,
    left: { letter: "L", name: "统筹主导" },
    right: { letter: "M", name: "专精深耕" },
  };
}

function getFallbackCareerType() {
  return careerTypes[0];
}

export function calculateJobtiResult(answers: Array<number | null>): JobtiResult {
  const dimensions = (["AR", "PD", "XS", "LM"] as const).map((dimension) => {
    const { questions, left, right } = getDimensionMeta(dimension);

    return scoreDimension(dimension, left.letter, right.letter, left.name, right.name, questions, answers);
  });

  const typeCode = dimensions.map((dimension) => dimension.pickedLetter).join("");
  const careerType = getCareerTypeByCode(typeCode) ?? getFallbackCareerType();

  const userVector = {
    AR: dimensions[0]?.normalized ?? 50,
    PD: dimensions[1]?.normalized ?? 50,
    XS: dimensions[2]?.normalized ?? 50,
    LM: dimensions[3]?.normalized ?? 50,
  };

  const jobs = normalizedJobs
    .map((job) => {
      const distance =
        Math.abs(userVector.AR - job.AR_score) +
        Math.abs(userVector.PD - job.PD_score) +
        Math.abs(userVector.XS - job.XS_score) +
        Math.abs(userVector.LM - job.LM_score);

      const codeBonus = job.primary_code === typeCode ? 22 : job.altCodesList.includes(typeCode) ? 12 : 0;
      const rank = jobTypeRankByKey.get(`${job.job_id}:${typeCode}`) ?? 0;
      const rankBonus = rank > 0 ? Math.max(0, 12 - rank * 2) : 0;
      const fitScore = clamp(Math.round(100 - distance / 4 + codeBonus + rankBonus), 0, 100);

      return {
        job,
        fitScore,
        distance,
        codeBonus,
        rankBonus,
      };
    })
    .sort((left, right) => right.fitScore - left.fitScore)
    .slice(0, 10);

  const abilityCounts = new Map<string, number>();

  jobs.forEach(({ job }) => {
    job.coreAbilityIds.forEach((abilityId) => {
      abilityCounts.set(abilityId, (abilityCounts.get(abilityId) ?? 0) + 1);
    });
  });

  const topAbilities = [...abilityCounts.entries()]
    .map(([abilityId, count]) => ({
      id: abilityId,
      name: getAbilityById(abilityId)?.ability_name ?? abilityId,
      count,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
    .slice(0, 8);

  return {
    typeCode,
    careerType,
    dimensions,
    jobs,
    topAbilities,
  };
}

export function createEmptyAnswers() {
  return Array.from({ length: normalizedQuestions.length }, () => null as number | null);
}
