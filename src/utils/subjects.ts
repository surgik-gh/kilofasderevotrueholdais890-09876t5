export const SUBJECT_CATEGORIES = {
  "Точные науки": [
    "Математика",
    "Геометрия",
    "Вероятность и статистика",
    "Физика",
    "Информатика",
    "Программирование"
  ],
  "Гуманитарные науки": [
    "Русский язык",
    "Литература",
    "История",
    "Обществознание"
  ],
  "Естественные науки": [
    "Биология",
    "Химия",
    "География"
  ],
  "Другое": [
    "ОБЖ",
    "Физкультура",
    "Музыка"
  ]
};

export const ALL_SUBJECTS = Object.values(SUBJECT_CATEGORIES).flat();

// Mapping from Russian to English subject names (for database)
export const SUBJECT_MAPPING: Record<string, string> = {
  "Математика": "mathematics",
  "Геометрия": "geometry",
  "Вероятность и статистика": "probability_statistics",
  "Физика": "physics",
  "Информатика": "informatics",
  "Программирование": "programming",
  "Русский язык": "russian_language",
  "Литература": "literature",
  "История": "history",
  "Обществознание": "social_studies",
  "Биология": "biology",
  "Химия": "chemistry",
  "География": "geography",
  "ОБЖ": "obzh",
  "Физкультура": "physical_education",
  "Музыка": "music"
};

// Reverse mapping from English to Russian
export const SUBJECT_MAPPING_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_MAPPING).map(([ru, en]) => [en, ru])
);
