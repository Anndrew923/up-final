import { describe, expect, it } from 'vitest';
import { splitAssessmentLobbyTitle } from '../splitAssessmentLobbyTitle';

describe('splitAssessmentLobbyTitle', () => {
  it('splits zh-Hant fullwidth parentheses', () => {
    expect(splitAssessmentLobbyTitle('五項力量（整車馬力 // HP）')).toEqual({
      main: '五項力量',
      sub: '整車馬力 // HP',
    });
  });

  it('splits en ASCII parentheses', () => {
    expect(splitAssessmentLobbyTitle('Max Strength (Chassis HP)')).toEqual({
      main: 'Max Strength',
      sub: 'Chassis HP',
    });
  });

  it('returns full title when no subtitle parens', () => {
    expect(splitAssessmentLobbyTitle('Strength test')).toEqual({
      main: 'Strength test',
    });
  });

  it('splits FFMI titles in both locales', () => {
    expect(splitAssessmentLobbyTitle('FFMI（引擎排量軸）')).toEqual({
      main: 'FFMI',
      sub: '引擎排量軸',
    });
    expect(splitAssessmentLobbyTitle('FFMI (Displacement Axis)')).toEqual({
      main: 'FFMI',
      sub: 'Displacement Axis',
    });
  });
});
