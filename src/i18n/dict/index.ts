import type ruDict from "./ru";

// Тип словаря берём из русского: казахский и английский обязаны совпадать по ключам.
type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dict = Widen<typeof ruDict>;
