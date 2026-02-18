const { calculateFullPrice, calculateFinalPrice } = require('../price.service');

describe('Price Service', () => {

  describe('calculateFinalPrice', () => {
    test('Calcula preço final com margem e IVA corretamente', () => {
      const result = calculateFinalPrice(100, 20, 23);
      expect(result).toBe(147.60);
    });

    test('Erro se base for negativa', () => {
      expect(() => calculateFinalPrice(-1, 20, 23)).toThrow('Preço base inválido.');
    });
  });

  describe('calculateFullPrice - cenários principais', () => {

    const sampleParams = {
      filaments: [
        { material: 'PLA', costPerKg: 25, weight: 150 }
      ],
      printHours: 2,
      printMins: 30,
      laborMins: 30,
      hardwareCost: 1.5,
      packagingCost: 1.2,
      vatRate: 23,
      laborRate: 15,
      efficiency: 1.1,
      printerCost: 749,
      upfrontCost: 0,
      maintenance: 75,
      printerLife: 3,
      uptime: 50,
      powerW: 150,
      energyRate: 0.20,
      bufferFactor: 1.3,
      customMargin: 50
    };

    let result;
    beforeAll(() => {
      result = calculateFullPrice(sampleParams);
    });

    test('Retorna breakdown com campos esperados', () => {
      expect(result.breakdown).toHaveProperty('materialCost');
      expect(result.breakdown).toHaveProperty('laborCost');
      expect(result.breakdown).toHaveProperty('machineCost');
      expect(result.breakdown).toHaveProperty('baseLanded');
    });

    test('Material cost é calculado corretamente', () => {
      const { materialCost } = result.breakdown;
      // cálculo: (25€/kg / 1000) * 150g * efficiency 1.1
      const expected = Number(((25 / 1000) * 150 * 1.1).toFixed(2));
      expect(materialCost).toBe(expected);
    });

    test('Sugestão de preços inclui margens esperadas', () => {
      const { suggestedPrices } = result;
      expect(typeof suggestedPrices.standard.price).toBe('number');
      expect(typeof suggestedPrices.standard.priceVat).toBe('number');
    });

    test('Preço com VAT > preço sem VAT', () => {
      const { suggestedPrices } = result;
      const std = suggestedPrices.standard;
      expect(std.priceVat).toBeGreaterThan(std.price);
    });

    test('Printer Metrics contém campos calculados', () => {
      const { printerMetrics } = result;
      expect(printerMetrics).toHaveProperty('printerCostPerHr');
      expect(printerMetrics.printerCostPerHr).toBeGreaterThan(0);
    });

  });

  describe('calculateFullPrice - validações', () => {

    test('Erro se filaments vazio', () => {
      expect(() => calculateFullPrice({ filaments: [] }))
        .toThrow('É necessário pelo menos um filamento.');
    });

    test('Erro se uptime inválido', () => {
      expect(() => calculateFullPrice({ filaments: [{ material: 'PLA', costPerKg: 20, weight: 100 }], uptime: 0 }))
        .toThrow('Uptime inválido (1–100).');
    });

    test('Erro se printerLife <= 0', () => {
      expect(() => calculateFullPrice({ filaments: [{ material: 'PLA', costPerKg: 20, weight: 100 }], printerLife: 0 }))
        .toThrow('Vida útil da impressora inválida.');
    });

    test('Erro se bufferFactor < 1', () => {
      expect(() => calculateFullPrice({ filaments: [{ material: 'PLA', costPerKg: 20, weight: 100 }], bufferFactor: 0.5 }))
        .toThrow('Fator buffer deve ser >= 1.');
    });

  });

});

