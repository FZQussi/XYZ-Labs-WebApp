const { calculateFinalPrice } = require('../price.service');

describe('Price Service - calculateFinalPrice', () => {

  test('Calcula corretamente preço com margem e IVA', () => {
    const result = calculateFinalPrice(100, 20, 23);
    expect(result).toBe(147.60);
  });

  test('Funciona com valores zero', () => {
    const result = calculateFinalPrice(100, 0, 0);
    expect(result).toBe(100);
  });

test('Arredonda para 2 casas decimais', () => {
  const result = calculateFinalPrice(99.99, 15, 23);
  expect(result).toBe(141.44);
});


  test('Lança erro se preço base for negativo', () => {
    expect(() => {
      calculateFinalPrice(-100, 20, 23);
    }).toThrow("Preço base inválido");
  });

});
