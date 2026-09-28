export function createCatalog<M extends { id: string }, L extends { id: string; moduleId: string }>(
  modules: readonly M[],
  lessons: readonly L[],
) {
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  const moduleById = new Map(modules.map((m) => [m.id, m]));
  return {
    lessonById: (id: string): L | undefined => lessonById.get(id),
    moduleById: (id: string): M | undefined => moduleById.get(id),
    lessonsForModule: (moduleId: string): readonly L[] => lessons.filter((l) => l.moduleId === moduleId),
  };
}
