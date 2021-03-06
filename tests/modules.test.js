import * as actions from 'modules/locale';
import { shallow } from 'enzyme';
import { languages, translations, getActiveLanguage, getTranslationsForActiveLanguage, customeEqualSelector, setLanguages, getTranslate, getTranslateSelector } from 'modules/locale';
import { getLocalizedElement } from 'utils';
import { SET_LANGUAGES, SET_ACTIVE_LANGUAGE, ADD_TRANSLATION } from 'modules/locale';

describe('locale module', () => {

  describe('reducer: languages', () => {
    let initialState = [];

    beforeEach(() => {
      initialState = [
        { code: 'en', active: false },
        { code: 'fr', active: false },
        { code: 'ne', active: false }
      ];
    });

    it('should add new languages with first set to active by default', () => {
      const action = {
        type: SET_LANGUAGES,
        payload: {
          languageCodes: ['en', 'fr', 'ne']
        }
      };

      const result = languages([], action);
      expect(result).toEqual([
        { code: 'en', active: true },
        { code: 'fr', active: false },
        { code: 'ne', active: false }
      ]);
    });

    it('should set active language', () => {
      const action = {
        type: SET_ACTIVE_LANGUAGE,
        payload: {
          languageCode: 'ne'
        }
      };

      const result = languages(initialState, action);
      expect(result).toEqual([
        { code: 'en', active: false },
        { code: 'fr', active: false },
        { code: 'ne', active: true }
      ]);
    });

    it('should update active language', () => {
      const action = {
        type: SET_ACTIVE_LANGUAGE,
        payload: {
          languageCode: 'en'
        }
      };

      initialState[1].active = true;
      const result = languages(initialState, action);
      expect(result).toEqual([
        { code: 'en', active: true },
        { code: 'fr', active: false },
        { code: 'ne', active: false }
      ]);
    });

    it('should set active language to first language in array by default', () => {
      const result = languages([], setLanguages(['en', 'fr', 'ne']));

      expect(result).toEqual([
        { code: 'en', active: true },
        { code: 'fr', active: false },
        { code: 'ne', active: false }
      ]);
    });

    it('should set active language = to activeIndex passed to setLanguages', () => {
      const result = languages([], setLanguages(['en', 'fr', 'ne'], 'fr'));

      expect(result).toEqual([
        { code: 'en', active: false },
        { code: 'fr', active: true },
        { code: 'ne', active: false }
      ]);
    });
  });

  describe('reducer: translations', () => {
    let initialState = {};

    beforeEach(() => {
      initialState = {
        'hi': ['hi'],
        'bye': ['bye']
      };
    });

    it('should add new translations',  () => {
      const action = {
        type: ADD_TRANSLATION,
        payload: {
          translation: {
            'test': ['test'],
            'test2': ['test2']
          }
        }
      };

      const result = translations({}, action);
      expect(result).toEqual({
        'test': ['test'],
        'test2': ['test2']
      });
    });

    it('should merge new translations with existing translations', () => {
      const action = {
        type: ADD_TRANSLATION,
        payload: {
          translation: { 'new': ['new'] }
        }
      };

      const result = translations(initialState, action);
      expect(result).toEqual({
        ...initialState,
        'new': ['new']
      });
    });

    it('should overwrite existing translation key if it already exists', () => {
      const action = {
        type: ADD_TRANSLATION,
        payload: {
          translation: { 'hi': ['new'] }
        }
      };

      const result = translations(initialState, action);
      expect(result).toEqual({
        ...initialState,
        'hi': ['new']
      });
    });

    it('should flatten nested objects in translation', () => {
      const action = {
        type: ADD_TRANSLATION,
        payload: {
          translation: {
            'first': { second: { third: ['nested'] }},
            'more': { nested: ['one'] }
          }
        }
      };

      const result = translations({}, action);
      expect(result).toEqual({
        'first.second.third': ['nested'],
        'more.nested': ['one']
      });
    });
  });

  describe('getActiveLanguage', () => {
    it('should return the active language object', () => {
      const state = {
        languages: [{ code: 'en', active: false }, { code: 'fr', active: true }, { code: 'ne', active: false }]
      };
      const result = getActiveLanguage(state);
      expect(result.code).toBe('fr');
    });

    it('should return undefined if no active language found', () => {
      const state = {
        languages: [{ code: 'en', active: false }, { code: 'fr', active: false }]
      };
      const result = getActiveLanguage(state);
      expect(result).toBe(undefined);
    });
  });

  describe('getTranslationsForActiveLanguage', () => {
    it('should return translations only for the active language', () => {
      const state = {
        languages: [{ code: 'en', active: false }, { code: 'fr', active: true }],
        translations: {
          hi: ['hi-en', 'hi-fr'],
          bye: ['bye-en', 'bye-fr']
        }
      };
      const result = getTranslationsForActiveLanguage(state);
      expect(result).toEqual({
        hi: 'hi-fr',
        bye: 'bye-fr'
      });
    });
  });

  describe('getTranslate', () => {
    let state = {};

    beforeEach(() => {
      state = {
        languages: [{ code: 'en', active: false }, { code: 'fr', active: true }],
        translations: {
          hi: ['hi-en', 'hi-fr'],
          bye: ['bye-en', 'bye-fr'],
          yo: ['yo ${ name }', 'yo-fr ${ name }'],
          foo: ['foo ${ bar }', 'foo-fr ${ bar }']
        }
      };
    });

    it('should throw an error when invalid key provided to translate function', () => {
      const translate = getTranslate(state);
      expect(() => translate(23)).toThrow();
    });

    it('should return single translated element when valid key provided', () => {
      const translate = getTranslate(state);
      const value = translate('hi');
      expect(value).toBe('hi-fr');
    });

    it('should return an object of translation keys matched with translated element', () => {
      const translate = getTranslate(state);
      const result = translate(['hi', 'bye']);
      
      Object.keys(result).map((key, index) => {
        const value = result[key];
        expect(value).toBe(state.translations[key][1]);
      });
    });

    it('should insert dynamic data for single translation', () => {
      const translate = getTranslate(state);
      const result = translate('yo', { name: 'ted' });
      // const wrapper = shallow(element);
      expect(result).toBe('yo-fr ted');
    });

    it('should insert dynamic data for multiple translations', () => {
      const translate = getTranslate(state);
      const result = translate(['yo', 'foo'], { name: 'ted', bar: 'bar' });
      const results = [
        'yo-fr ted',
        'foo-fr bar'
      ];
      
      Object.keys(result).map((key, index) => {
        const value = result[key];
        expect(value).toBe(results[index]);
      });
    });
  });

  describe('customeEqualSelector', () => {
    let languages = [];
    let activeLanguage = {};
    let translations = {};

    beforeEach(() => {
      languages = [{ code: 'en', active: false }, { code: 'fr', active: true }];
      activeLanguage = { code: 'en', active: true };
      translations = {
        one: 'one',
        two: 'two',
        three: 'three'
      };
    });

    it('should call result function when languages changes', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => languages, result);
      selector({});
      languages = [...languages, [...{ code: 'ca', active: false }]];
      selector({});
      expect(result).toHaveBeenCalledTimes(2);
    });

    it('should not call result function when languages haven\'t changed', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => languages, result);
      selector({});
      selector({});
      expect(result).toHaveBeenCalledTimes(1);
    });

    it('should call result function when active language changes', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => activeLanguage, result);
      selector({});
      activeLanguage = { code: 'ca', active: false };
      selector({});
      expect(result).toHaveBeenCalledTimes(2);
    });

    it('should not call result function when active language hasn\'t changed', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => activeLanguage, result);
      selector({});
      selector({});
      expect(result).toHaveBeenCalledTimes(1);
    });

    it('should call result function when translations change', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => translations, result);
      selector({});
      translations = { ...translations, four: 'four' };
      selector({});
      expect(result).toHaveBeenCalledTimes(2);
    });

    it('should not call result function when translations haven\'t changed', () => {
      const result = jest.fn();
      const selector = customeEqualSelector(() => translations, result);
      selector({});
      selector({});
      expect(result).toHaveBeenCalledTimes(1);
    });
  });
});