type ServiceAreaResult = { latitude: number; longitude: number; radius_km: number };

let _result: ServiceAreaResult | null = null;

export const serviceAreaResult = {
  set: (r: ServiceAreaResult) => {
    _result = r;
  },
  consume: (): ServiceAreaResult | null => {
    const r = _result;
    _result = null;
    return r;
  },
};
