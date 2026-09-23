// 테스트에서 응답 본문을 기대하는 API 응답 타입으로 읽는다 (res.json() 은 any 를 돌려주므로).
export function readJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}
