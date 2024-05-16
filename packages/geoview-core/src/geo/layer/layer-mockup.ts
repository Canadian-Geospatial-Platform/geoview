import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerEntryType,
  TypeStyleConfig,
  TypeVectorSourceFormats,
} from '../map/map-schema-types';

export abstract class LayerMockup {
  static getTop100Feature(): TypeGeoviewLayerConfig {
    // Redirect
    return this.#configRoot(
      'top100Feature',
      'esriFeature',
      'Top 100 Expl. Pro. (ignored)',
      'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/900A_and_top_100_en/MapServer',
      [this.#getTop100FeatureLayerEntry()]
    );
  }

  static getTop100Dynamic(): TypeGeoviewLayerConfig {
    // Redirect
    return this.#configRoot(
      'top100Dynamic',
      'esriDynamic',
      'Top 100 Expl. Pro. (ignored)',
      'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/900A_and_top_100_en/MapServer',
      [this.#getTop100DynamicLayerEntry()]
    );
  }

  static getFeaturesInGroupLayer(): TypeGeoviewLayerConfig {
    return {
      geoviewLayerId: 'esriTop100',
      geoviewLayerType: 'esriFeature',
      geoviewLayerName: { en: 'My custom default label for creation' },
      metadataAccessPath: { en: 'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/900A_and_top_100_en/MapServer' },
      serviceDateFormat: 'DD/MM/YYYY HH:MM:SSZ',
      externalDateFormat: 'DD/MM/YYYY HH:MM:SSZ',
      listOfLayerEntryConfig: [
        {
          layerId: 'myCustomGroup',
          layerName: '900A & Top 100',
          entryType: 'group',
          bounds: [],
          initialSettings: {
            controls: {
              highlight: true,
              hover: true,
              opacity: true,
              query: true,
              remove: true,
              table: true,
              visibility: true,
              zoom: true,
            },
            states: {
              visible: true,
              opacity: 1,
              hoverable: true,
              queryable: true,
            },
          },
          listOfLayerEntryConfig: [this.#getTop100FeatureLayerEntry(), this.#getNonmetalMinesLayerEntry()],
        } as unknown as TypeLayerEntryConfig,
      ],
    };
  }

  static #getTop100FeatureLayerEntry(): TypeLayerEntryConfig {
    // Get metadata for Top100
    const metadata = this.#configTop100Metadata();
    const source = this.#configTop100Source('EsriJSON');
    const style = this.#configTop100Style();
    return this.#configLayerEntry('0', 'Top 100 Expl. Pro. (Feature)', 'vector', metadata, source, style);
  }

  static #getTop100DynamicLayerEntry(): TypeLayerEntryConfig {
    // Get metadata for Top100
    const metadata = this.#configTop100Metadata();
    const source = this.#configTop100Source(undefined);
    const style = this.#configTop100Style();
    return this.#configLayerEntry('0', 'Top 100 Expl. Pro. (Dynamic)', 'raster-image', metadata, source, style);
  }

  static #getNonmetalMinesLayerEntry(): TypeLayerEntryConfig {
    // Get metadata for Top100
    const metadata = this.#configNonMetalMetadata();
    const source = this.#configNonMetalSource();
    const style = this.#configNonMetalStyle();
    return this.#configNonMetalMines('5', metadata, source, style);
  }

  static #configRoot(
    id: string,
    type: string,
    layerName: string,
    metadataAccessPath: string,
    listOfLayerEntry: TypeLayerEntryConfig[]
  ): TypeGeoviewLayerConfig {
    return {
      geoviewLayerId: id,
      geoviewLayerType: type,
      geoviewLayerName: layerName,
      metadataAccessPath,
      serviceDateFormat: 'DD/MM/YYYY HH:MM:SSZ',
      externalDateFormat: 'DD/MM/YYYY HH:MM:SSZ',
      listOfLayerEntryConfig: listOfLayerEntry,
    } as unknown as TypeGeoviewLayerConfig;
  }

  static #configNonMetalMines(layerId: string, metadata: unknown, source: unknown, style: unknown): TypeLayerEntryConfig {
    return {
      layerId,
      layerName: 'Nonmetal mines',
      geometryType: 'point',
      entryType: 'vector',
      metadata,
      attributions: ['Government of Canada, Natural Resources Canada, Lands and Minerals Sector'],
      bounds: [-110, 40, -70, 80],
      minScale: 0,
      maxScale: 0,
      initialSettings: {
        controls: {
          highlight: true,
          hover: true,
          opacity: true,
          query: true,
          remove: true,
          table: true,
          visibility: true,
          zoom: true,
        },
        states: {
          visible: true,
          opacity: 1,
          hoverable: true,
          queryable: true,
        },
      },
      temporalDimension: {},
      source,
      style,
    } as unknown as TypeLayerEntryConfig;
  }

  static #configTop100Metadata(): unknown {
    return {
      currentVersion: 10.81,
      id: 0,
      name: 'Top 100 Exploration Projects',
      type: 'Feature Layer',
      description:
        'This dataset provides information related to the top-spending off-mine-site exploration and deposit appraisal projects in Canada for the given reference year. The dataset is maintained by the Lands and Minerals Sector, Natural Resources Canada, and forms the basis for the annual Map of Top 100 Exploration and Deposit Appraisal Projects in Canada.',
      geometryType: 'esriGeometryPoint',
      sourceSpatialReference: {
        wkid: 3978,
        latestWkid: 3978,
      },
      copyrightText: 'Government of Canada; Natural Resources Canada; Lands and Minerals Sector',
      parentLayer: null,
      subLayers: [],
      minScale: 0,
      maxScale: 0,
      drawingInfo: {
        renderer: {
          type: 'simple',
          symbol: {
            type: 'esriPMS',
            url: '4f870319200f44ee41716f08b26cd03c',
            imageData:
              'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAstJREFUOI2101tIFFEYB/D/mV13z657cU3LFWLTHhQMQ7zkBYroJhU9VEQPgRQkpFFLVBgSUgZJSVCZRm+WJUhhdqGwfLGiCO1KlOmDlLGQ1111Z2bXna+XUkd3ZVT64Lycy2++Oef79PhPodeySZJ8K6GwJDA4wKhfUajLbLZ7FgQTDRtlSV9KQLEi+lMU7whIkiCYoyHELiFJGu0gosucW+8wxkgTLIq+dFlizcHenmTpaTOC7TXAxNDkOrNlMkPhgWy+YVuD7GCH/X7fbrPZ9mtOWBRH8xGaaB1vboyWm0rC/42vE3JTJwL3z8Hsrs81ZuW9laSxAs4tvWFhv9+bAKJ74w3XowOPT0W6pakPBDwYv7AZ5H6UyPPXPfT5fDk2m02cBQuCUCm9bk/QgqoSurIL+hXvV0UlLncDOK+C/X5vgiJL+8X6qnmhAABFhnj3JqxHyk8QeaoZcwYnYYEJO+TurzoafKE6Y7/WM8sJDfzGWEW+ai74sgqhohKHjNj1AFqnroIhe6Ln+yxEF79Mc+ITP3sh2B1ZapiQQEP9mpFwQT4vGMgJTH88BgkGTY0YOfRRIGBGVRD6hLjERbmCIxaMoU8FE9AWlZLmlhaIMu6C3pUEImpTwYGA8tzoSurXrS6OD328MXlgaI9VE2zYWQ7BwD9xk/WLCrbb7ZIojp4x7yutGf1cDyiy5mwF5xaYNm0Hgcr+zalei3NLnexK3m4+1lLory7UhDJbJiwnL0GIttZyk/VJWJgxpojiyF6eU/BAOPtm7XjdaZDnWURUl3EIloPHoYtbetvILUenr82qL5Mpxkvk2UipaZUxFxvd8ocOY7DzFULd70CDXWDODOjT82DIyEVUatowE1gF59arM52whcuYMwigTBTHavmagiKeU7AVQDKAGAADAL6BUQtAtzi3DYcz5uwIk8nyA0Dl3zGvWGSrRY4/rRIKxL8NeuEAAAAASUVORK5CYII=',
            contentType: 'image/png',
            width: 16,
            height: 16,
            angle: 0,
            xoffset: 0,
            yoffset: 0,
          },
          label: '',
          description: '',
        },
        transparency: 0,
        labelingInfo: null,
      },
      defaultVisibility: true,
      extent: {
        xmin: -2048671.9916992188,
        ymin: -53207.838317871094,
        xmax: 2752332.3021240234,
        ymax: 2240863.497680664,
        spatialReference: {
          wkid: 3978,
          latestWkid: 3978,
        },
      },
      hasAttachments: false,
      htmlPopupType: 'esriServerHTMLPopupTypeAsHTMLText',
      displayField: 'project_name',
      typeIdField: null,
      subtypeFieldName: null,
      subtypeField: null,
      defaultSubtypeCode: null,
      fields: [
        {
          name: 'OBJECTID',
          type: 'esriFieldTypeOID',
          alias: 'OBJECTID',
          domain: null,
        },
        {
          name: 'Shape',
          type: 'esriFieldTypeGeometry',
          alias: 'Shape',
          domain: null,
        },
        {
          name: 'count',
          type: 'esriFieldTypeInteger',
          alias: 'Count',
          domain: null,
        },
        {
          name: 'project_name',
          type: 'esriFieldTypeString',
          alias: 'Project Name / Nom du projet',
          length: 48,
          domain: null,
        },
        {
          name: 'province_en',
          type: 'esriFieldTypeString',
          alias: 'Province / Territory',
          length: 48,
          domain: null,
        },
        {
          name: 'province_fr',
          type: 'esriFieldTypeString',
          alias: 'Province / Territoire',
          length: 48,
          domain: null,
        },
        {
          name: 'commodity_group_en',
          type: 'esriFieldTypeString',
          alias: 'Commodity Group',
          length: 48,
          domain: null,
        },
        {
          name: 'commodity_group_fr',
          type: 'esriFieldTypeString',
          alias: 'Groupe de produits min�raux',
          length: 48,
          domain: null,
        },
      ],
      geometryField: {
        name: 'Shape',
        type: 'esriFieldTypeGeometry',
        alias: 'Shape',
      },
      indexes: [
        {
          name: 'FDO_OBJECTID',
          fields: 'OBJECTID',
          isAscending: true,
          isUnique: true,
          description: '',
        },
        {
          name: 'FDO_Shape',
          fields: 'Shape',
          isAscending: true,
          isUnique: false,
          description: '',
        },
        {
          name: 'count_idx',
          fields: 'count',
          isAscending: true,
          isUnique: false,
          description: '',
        },
      ],
      subtypes: [],
      relationships: [],
      canModifyLayer: true,
      canScaleSymbols: false,
      hasLabels: false,
      capabilities: 'Map,Data,Query',
      maxRecordCount: 1000,
      supportsStatistics: true,
      supportsAdvancedQueries: true,
      supportedQueryFormats: 'JSON, geoJSON',
      isDataVersioned: false,
      ownershipBasedAccessControlForFeatures: {
        allowOthersToQuery: true,
      },
      useStandardizedQueries: true,
      advancedQueryCapabilities: {
        useStandardizedQueries: true,
        supportsStatistics: true,
        supportsHavingClause: true,
        supportsCountDistinct: true,
        supportsOrderBy: true,
        supportsDistinct: true,
        supportsPagination: true,
        supportsTrueCurve: true,
        supportsReturningQueryExtent: true,
        supportsQueryWithDistance: true,
        supportsSqlExpression: true,
      },
      supportsDatumTransformation: true,
      supportsCoordinatesQuantization: true,
      serviceItemId: 'e6847c6b6a7b41d0bcbe061d304ae034',
    };
  }

  static #configTop100Source(format: TypeVectorSourceFormats | undefined): unknown {
    return {
      format,
      featureInfo: {
        nameField: 'project_name',
        outfields: [
          { name: 'project_name', alias: 'Project Name / Nom du projet', type: 'string', domain: [] },
          { name: 'count', alias: 'Count', type: 'number', domain: [] },
          { name: 'province_en', alias: 'Province / Territory', type: 'string', domain: [] },
          { name: 'province_fr', alias: 'Province / Territoire', type: 'string', domain: [] },
        ],
        queryable: true,
      },
    };
  }

  static #configTop100Style(): TypeStyleConfig {
    return {
      Point: {
        styleType: 'simple',
        label: '',
        settings: {
          type: 'iconSymbol',
          mimeType: 'image/png',
          src: 'iVBORw0KGgoAAAANSUhEUgAAABYAAAAWCAYAAADEtGw7AAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAAstJREFUOI2101tIFFEYB/D/mV13z657cU3LFWLTHhQMQ7zkBYroJhU9VEQPgRQkpFFLVBgSUgZJSVCZRm+WJUhhdqGwfLGiCO1KlOmDlLGQ1111Z2bXna+XUkd3ZVT64Lycy2++Oef79PhPodeySZJ8K6GwJDA4wKhfUajLbLZ7FgQTDRtlSV9KQLEi+lMU7whIkiCYoyHELiFJGu0gosucW+8wxkgTLIq+dFlizcHenmTpaTOC7TXAxNDkOrNlMkPhgWy+YVuD7GCH/X7fbrPZ9mtOWBRH8xGaaB1vboyWm0rC/42vE3JTJwL3z8Hsrs81ZuW9laSxAs4tvWFhv9+bAKJ74w3XowOPT0W6pakPBDwYv7AZ5H6UyPPXPfT5fDk2m02cBQuCUCm9bk/QgqoSurIL+hXvV0UlLncDOK+C/X5vgiJL+8X6qnmhAABFhnj3JqxHyk8QeaoZcwYnYYEJO+TurzoafKE6Y7/WM8sJDfzGWEW+ai74sgqhohKHjNj1AFqnroIhe6Ln+yxEF79Mc+ITP3sh2B1ZapiQQEP9mpFwQT4vGMgJTH88BgkGTY0YOfRRIGBGVRD6hLjERbmCIxaMoU8FE9AWlZLmlhaIMu6C3pUEImpTwYGA8tzoSurXrS6OD328MXlgaI9VE2zYWQ7BwD9xk/WLCrbb7ZIojp4x7yutGf1cDyiy5mwF5xaYNm0Hgcr+zalei3NLnexK3m4+1lLory7UhDJbJiwnL0GIttZyk/VJWJgxpojiyF6eU/BAOPtm7XjdaZDnWURUl3EIloPHoYtbetvILUenr82qL5Mpxkvk2UipaZUxFxvd8ocOY7DzFULd70CDXWDODOjT82DIyEVUatowE1gF59arM52whcuYMwigTBTHavmagiKeU7AVQDKAGAADAL6BUQtAtzi3DYcz5uwIk8nyA0Dl3zGvWGSrRY4/rRIKxL8NeuEAAAAASUVORK5CYII=',
          rotation: 0,
          opacity: 1,
          offset: [0, 0],
        },
      },
    };
  }

  static #configNonMetalMetadata(): unknown {
    return {
      currentVersion: 10.81,
      id: 5,
      name: 'Nonmetal mines',
      type: 'Feature Layer',
      description:
        'This dataset provides information related to the principal producing nonmetal mines operating in Canada during the given reference year. The dataset is maintained by the Lands and Minerals Sector, Natural Resources Canada, and is a subset of information available on Map 900a – Principal Mineral Areas, Producing Mines, and Oil and Gas Fields in Canada.',
      geometryType: 'esriGeometryPoint',
      sourceSpatialReference: {
        wkid: 3978,
        latestWkid: 3978,
      },
      copyrightText: 'Government of Canada; Natural Resources Canada; Lands and Minerals Sector',
      parentLayer: {
        id: 3,
        name: 'Producing Mines',
      },
      subLayers: [],
      minScale: 0,
      maxScale: 0,
      drawingInfo: {
        renderer: {
          type: 'uniqueValue',
          field1: 'commodity_group_en_spelt',
          field2: null,
          field3: null,
          defaultSymbol: null,
          defaultLabel: null,
          uniqueValueInfos: [
            {
              symbol: {
                type: 'esriPMS',
                url: '159b939f17e74dfc257e984d50473474',
                imageData:
                  'iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA8dJREFUSInN1ktMXFUYwPH/uVxmzoV5tBWGBe+SGqn4imIs1ADqwsRE48a4tEQaH7Q+6sKkCopuXOiqSbVAfaxNunDTNrQDtqlFEhMtFI2VaXm0PGZoywxzDwNzj4uhIB0YoDbGb3dzvvv9zj3fOSfX5D8K838BKTVTAeIztM48ISF+kdLbdkeQUrPlaCcIFIPI6KB5QdnRrdLyvrMpSKlY2S1kvP84kd+/W9PIcgcoqzuI9OW/reyoIS3vWxuCbDtWgtZBoHR84ASRwY6MH2NaAULdbZTXf4j0BfYrOyqk5d2fEbLtaLFAB4Gy8YsniFxsTw0IA7STrggXRY83oZPzjPYdpai6EekL7FP2jJCWb9+qUDw+UyggCGyfGOwiMpBCdjzXQbblYy4aYeLCMWJXTy6/rRMMnXqfsro2ynY3c+XsIQof24P0FzQvYs0rIK2vZc8pEQQqJgZPEe7/cqlWtuVDCAPpy6ek5lUmB8sIDxxZtpI2yfk4hhmgsLqRUPenlNcdRPoL3lR2dFpa3pYlyLb9bkMkd8Qmhwj3H16xOnMzU0h/QWqlhMGCfXN55QxJUW0LptvDHz80s+3el/AV1RHq+YTK5w8B+sFVe5RMJtLaMH7hGKW1exHCQGuH5Ly9hBTvbiHb2kIo+BHOfITwwGE8hc/iJKbT6qx7M8xe62JioJRkIo5OJiiqfpkRZ4FtFU+mkO6PcRKTS/mxseMgXJuHACKDncsPwqC0Zg9zsWmGTrfizI1vpMTm7jphSPwljzI3e50sl8Tt2449dbch4Ur1xO1hqOsDcvIepnhXE8PnHFT4/F2ChElxbSum27vY+DCxqycZ+3mBkl17GT6nUZHefwkJk6KaVrKll8vdqd11K2bHTzPau0DxE02M/OSgpvsyQ47jOEYWTu49JYZry0Mkbvy6lCC3PoLpsgj1tKLnr6cViE/+yEhvgvz7X2TkTArK2/nK4iTF/ArI4/HElYo2mq6co+V17xqhni+WMDXdx+Xg2jMFUOHzjJxJ9Smv6jUKKp8BdAiM91ZAAFJ6v1UqKkxXbmcK+5zEjd8yArdHXtXrFFQ+DTCkMRos6RlOgxaxb5axA2IzWH7VGwQqnwL4S0ODZXlG/jmethmk9H6t7KhhunLbN4rlP9BM4L56gEspxDt6e86qu05a3k5lzwjTlXukvO6AmJ26siaSle3GE6gAuORoXZ+T4xtbLW/N7S0tX8ci9pW/cOc6Pw386WjdsBaSEVrE2pW6+b0QWVmZ8pRKxvx+v8qUs+6BldKffnjuIP4GhRKFGHM5YJsAAAAASUVORK5CYII=',
                contentType: 'image/png',
                width: 19,
                height: 19,
                angle: 0,
                xoffset: 0,
                yoffset: 0,
              },
              value: 'Industrial minerals',
              label: 'Industrial minerals',
              description: '',
            },
            {
              symbol: {
                type: 'esriPMS',
                url: 'd8fcdd17b0351547910959813fa2066b',
                imageData:
                  'iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA+xJREFUSInN1m9MVWUcwPHvc4B7z7ncc/+4Cm5NMeDiehEgodBaS6ZOHLpe0CrL1rKlbfknldlamyu3aK3NzY221OzPqvVGh3pxc0mDrYVcEcStF/JHXGWCoKgc4DzIvef0gttVunC5lms9b3+/8/uc5/ye57eTzn+00v8XkJQjeSA+xraTv5AQHaqq7/lHkJRjj2JbTcB8EEkdbJ6VpuFXNX37PUFSji78C6lv72JHx8VZjRKXg0+rysj26W9L01BUTd+WEmSaowuw7SYg52hHF+vO9ibdTI7LyaZQmP1ry8j26VulaQhV07cmhUzTmC+wm4CFxzq6eLFtCnEKwYRtJyABRbCrophI1OKT5vPULCsi4NO3SHNEqJpny4zQ+PjIIwKagNyGc928EEOurK/A59IYvDXKd20XeK9vMP5wv2VTXd/C92vL+KByCe+fPMvOZx4n4PdsjmGbp0G23Z8xIUUTkHeis4fnzvTEi/lcGooQZPt0tq8oJdjZw/N3xa9EoozdniSQobNzWSFvhsJ8tmYpAb/nLWkaw6qm745Dpul1KiIa7O6/RnW4e9rnuXrTIOD3AKAIwfCYvNOfNEH96lI8qoNV3zayozCX6twsNjaECb2yErALZ+zRRCSa0Idv2i5Qs3IJihBYts3oZGQa4s/UeO34aVpkhJYz3XyUn8UvcjKhzpyTYfelIYIdXRhykgnLYuPTRUQsm1WPLcDvUnkj1Eqzeafwu71XCSiJ9y6lEbTu7J17pADblpdwbWSMDcdOc2r8diol7m3W5aQJnsp7mOvGOC6ng2K/m1Pjw/cXCiixxmtO1tf/zMqAn10rSoj+0M7e/hv3B5onBA2Vpfg0J68eb+UnOUlz3yAT0fNTWGM7+/pv/jtonhCcrHwCr8vB+lArLTISj+35dYhIUyfvLF9MtPEcdQOzY+kAlmVZShpW7kN+ZdODOvuHjHjCS1leMp0ZvBwKE56IJBSovXwd+WMnG0qD1DW0AbCvNH8qKET8OKYDuN3ucSmNDZlOxxe1VeUKJ1rjWN3ATeqOnk666739N9gbQw4vDbJmcQFgXwKlZhoEoKr611IaItPpOPRhVblin2jlwF07S2UdKSugqjgI0GejVGiq+7cEKIZ9JaUh3E7HodqqcsE9YPXli1hdlA9w0YYKTXP/fnc84TCoqv6lNA3F7XQcTBU7+uQiKgvzAXqnEP3y33NmPHWqph+S5ohwOx0HaqvKxesD12dFNEcGBYEHAHot217mcnn+mClv1uOtap7PY9j+opzAHD8N9Fi2XTEbkhSKYQelvHVYiLS0ZHlSRke9Xq9MljPnhVVV79zzJYX1J6OwghYLe2y4AAAAAElFTkSuQmCC',
                contentType: 'image/png',
                width: 19,
                height: 19,
                angle: 0,
                xoffset: 0,
                yoffset: 0,
              },
              value: 'Diamonds',
              label: 'Diamonds',
              description: '',
            },
          ],
          fieldDelimiter: ',',
        },
        transparency: 0,
        labelingInfo: null,
      },
      defaultVisibility: true,
      extent: {
        xmin: -2123739.409790039,
        ymin: -666310.3306274414,
        xmax: 2960788.492919922,
        ymax: 2506457.0438842773,
        spatialReference: {
          wkid: 3978,
          latestWkid: 3978,
        },
      },
      hasAttachments: false,
      htmlPopupType: 'esriServerHTMLPopupTypeAsHTMLText',
      displayField: 'operation_name_en',
      typeIdField: null,
      subtypeFieldName: null,
      subtypeField: null,
      defaultSubtypeCode: null,
      fields: [
        {
          name: 'Shape',
          type: 'esriFieldTypeGeometry',
          alias: 'Shape',
          domain: null,
        },
        {
          name: 'operation_group_en',
          type: 'esriFieldTypeString',
          alias: 'Operation Group',
          length: 48,
          domain: null,
        },
        {
          name: 'province_en',
          type: 'esriFieldTypeString',
          alias: 'Province / Territory',
          length: 36,
          domain: null,
        },
        {
          name: 'operation_name_en',
          type: 'esriFieldTypeString',
          alias: 'Operation',
          length: 48,
          domain: null,
        },
        {
          name: 'operator_owners_en',
          type: 'esriFieldTypeString',
          alias: 'Operator / Owners',
          length: 120,
          domain: null,
        },
        {
          name: 'facilities_code_en_spelt',
          type: 'esriFieldTypeString',
          alias: 'Facility',
          length: 64,
          domain: null,
        },
        {
          name: 'commodity_group_en_spelt',
          type: 'esriFieldTypeString',
          alias: 'Commodity Group',
          length: 48,
          domain: null,
        },
        {
          name: 'commodity_en_spelt',
          type: 'esriFieldTypeString',
          alias: 'Commodity',
          length: 96,
          domain: null,
        },
        {
          name: 'OBJECTID',
          type: 'esriFieldTypeOID',
          alias: 'Unique identifier',
          domain: null,
        },
      ],
      geometryField: {
        name: 'Shape',
        type: 'esriFieldTypeGeometry',
        alias: 'Shape',
      },
      indexes: [
        {
          name: 'FDO_OBJECTID',
          fields: 'OBJECTID',
          isAscending: true,
          isUnique: true,
          description: '',
        },
        {
          name: 'FDO_Shape',
          fields: 'Shape',
          isAscending: true,
          isUnique: false,
          description: '',
        },
      ],
      subtypes: [],
      relationships: [],
      canModifyLayer: true,
      canScaleSymbols: false,
      hasLabels: false,
      capabilities: 'Map,Data,Query',
      maxRecordCount: 1000,
      supportsStatistics: true,
      supportsAdvancedQueries: true,
      supportedQueryFormats: 'JSON, geoJSON',
      isDataVersioned: false,
      ownershipBasedAccessControlForFeatures: {
        allowOthersToQuery: true,
      },
      useStandardizedQueries: true,
      advancedQueryCapabilities: {
        useStandardizedQueries: true,
        supportsStatistics: true,
        supportsHavingClause: true,
        supportsCountDistinct: true,
        supportsOrderBy: true,
        supportsDistinct: true,
        supportsPagination: true,
        supportsTrueCurve: true,
        supportsReturningQueryExtent: true,
        supportsQueryWithDistance: true,
        supportsSqlExpression: true,
      },
      supportsDatumTransformation: true,
      supportsCoordinatesQuantization: true,
      serviceItemId: 'e6847c6b6a7b41d0bcbe061d304ae034',
    };
  }

  static #configNonMetalSource(): unknown {
    return {
      maxRecordCount: 1000,
      layerFilter: '',
      featureInfo: {
        nameField: 'operation_name_en',
        outfields: [
          { name: 'operation_name_en', alias: 'Operation', type: 'string', domain: [] },
          { name: 'operator_owners_en', alias: 'Operator / Owners', type: 'string', domain: [] },
          { name: 'facilities_code_en_spelt', alias: 'Facility', type: 'string', domain: [] },
        ],
        queryable: true,
      },
    };
  }

  static #configNonMetalStyle(): unknown {
    return {
      type: 'uniqueValue',
      fields: ['commodity_group_en_spelt'],
      hasDefault: false,
      info: [
        {
          label: 'Industrial minerals',
          value: ['Industrial minerals'],
          visible: true,
          settings: {
            type: 'image/png',
            offset: [0, 0],
            size: [15, 15],
            rotation: 0,
            opacity: 1,
            image:
              'iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA8dJREFUSInN1ktMXFUYwPH/uVxmzoV5tBWGBe+SGqn4imIs1ADqwsRE48a4tEQaH7Q+6sKkCopuXOiqSbVAfaxNunDTNrQDtqlFEhMtFI2VaXm0PGZoywxzDwNzj4uhIB0YoDbGb3dzvvv9zj3fOSfX5D8K838BKTVTAeIztM48ISF+kdLbdkeQUrPlaCcIFIPI6KB5QdnRrdLyvrMpSKlY2S1kvP84kd+/W9PIcgcoqzuI9OW/reyoIS3vWxuCbDtWgtZBoHR84ASRwY6MH2NaAULdbZTXf4j0BfYrOyqk5d2fEbLtaLFAB4Gy8YsniFxsTw0IA7STrggXRY83oZPzjPYdpai6EekL7FP2jJCWb9+qUDw+UyggCGyfGOwiMpBCdjzXQbblYy4aYeLCMWJXTy6/rRMMnXqfsro2ynY3c+XsIQof24P0FzQvYs0rIK2vZc8pEQQqJgZPEe7/cqlWtuVDCAPpy6ek5lUmB8sIDxxZtpI2yfk4hhmgsLqRUPenlNcdRPoL3lR2dFpa3pYlyLb9bkMkd8Qmhwj3H16xOnMzU0h/QWqlhMGCfXN55QxJUW0LptvDHz80s+3el/AV1RHq+YTK5w8B+sFVe5RMJtLaMH7hGKW1exHCQGuH5Ly9hBTvbiHb2kIo+BHOfITwwGE8hc/iJKbT6qx7M8xe62JioJRkIo5OJiiqfpkRZ4FtFU+mkO6PcRKTS/mxseMgXJuHACKDncsPwqC0Zg9zsWmGTrfizI1vpMTm7jphSPwljzI3e50sl8Tt2449dbch4Ur1xO1hqOsDcvIepnhXE8PnHFT4/F2ChElxbSum27vY+DCxqycZ+3mBkl17GT6nUZHefwkJk6KaVrKll8vdqd11K2bHTzPau0DxE02M/OSgpvsyQ47jOEYWTu49JYZry0Mkbvy6lCC3PoLpsgj1tKLnr6cViE/+yEhvgvz7X2TkTArK2/nK4iTF/ArI4/HElYo2mq6co+V17xqhni+WMDXdx+Xg2jMFUOHzjJxJ9Smv6jUKKp8BdAiM91ZAAFJ6v1UqKkxXbmcK+5zEjd8yArdHXtXrFFQ+DTCkMRos6RlOgxaxb5axA2IzWH7VGwQqnwL4S0ODZXlG/jmethmk9H6t7KhhunLbN4rlP9BM4L56gEspxDt6e86qu05a3k5lzwjTlXukvO6AmJ26siaSle3GE6gAuORoXZ+T4xtbLW/N7S0tX8ci9pW/cOc6Pw386WjdsBaSEVrE2pW6+b0QWVmZ8pRKxvx+v8qUs+6BldKffnjuIP4GhRKFGHM5YJsAAAAASUVORK5CYII=',
          },
        },
        {
          label: 'Diamonds',
          value: ['Diamonds'],
          visible: true,
          settings: {
            type: 'image/png',
            offset: [0, 0],
            size: [15, 15],
            rotation: 0,
            opacity: 1,
            image:
              'iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAAAAXNSR0IB2cksfwAAAAlwSFlzAAAOxAAADsQBlSsOGwAAA+xJREFUSInN1m9MVWUcwPHvc4B7z7ncc/+4Cm5NMeDiehEgodBaS6ZOHLpe0CrL1rKlbfknldlamyu3aK3NzY221OzPqvVGh3pxc0mDrYVcEcStF/JHXGWCoKgc4DzIvef0gttVunC5lms9b3+/8/uc5/ye57eTzn+00v8XkJQjeSA+xraTv5AQHaqq7/lHkJRjj2JbTcB8EEkdbJ6VpuFXNX37PUFSji78C6lv72JHx8VZjRKXg0+rysj26W9L01BUTd+WEmSaowuw7SYg52hHF+vO9ibdTI7LyaZQmP1ry8j26VulaQhV07cmhUzTmC+wm4CFxzq6eLFtCnEKwYRtJyABRbCrophI1OKT5vPULCsi4NO3SHNEqJpny4zQ+PjIIwKagNyGc928EEOurK/A59IYvDXKd20XeK9vMP5wv2VTXd/C92vL+KByCe+fPMvOZx4n4PdsjmGbp0G23Z8xIUUTkHeis4fnzvTEi/lcGooQZPt0tq8oJdjZw/N3xa9EoozdniSQobNzWSFvhsJ8tmYpAb/nLWkaw6qm745Dpul1KiIa7O6/RnW4e9rnuXrTIOD3AKAIwfCYvNOfNEH96lI8qoNV3zayozCX6twsNjaECb2yErALZ+zRRCSa0Idv2i5Qs3IJihBYts3oZGQa4s/UeO34aVpkhJYz3XyUn8UvcjKhzpyTYfelIYIdXRhykgnLYuPTRUQsm1WPLcDvUnkj1Eqzeafwu71XCSiJ9y6lEbTu7J17pADblpdwbWSMDcdOc2r8diol7m3W5aQJnsp7mOvGOC6ng2K/m1Pjw/cXCiixxmtO1tf/zMqAn10rSoj+0M7e/hv3B5onBA2Vpfg0J68eb+UnOUlz3yAT0fNTWGM7+/pv/jtonhCcrHwCr8vB+lArLTISj+35dYhIUyfvLF9MtPEcdQOzY+kAlmVZShpW7kN+ZdODOvuHjHjCS1leMp0ZvBwKE56IJBSovXwd+WMnG0qD1DW0AbCvNH8qKET8OKYDuN3ucSmNDZlOxxe1VeUKJ1rjWN3ATeqOnk666739N9gbQw4vDbJmcQFgXwKlZhoEoKr611IaItPpOPRhVblin2jlwF07S2UdKSugqjgI0GejVGiq+7cEKIZ9JaUh3E7HodqqcsE9YPXli1hdlA9w0YYKTXP/fnc84TCoqv6lNA3F7XQcTBU7+uQiKgvzAXqnEP3y33NmPHWqph+S5ohwOx0HaqvKxesD12dFNEcGBYEHAHot217mcnn+mClv1uOtap7PY9j+opzAHD8N9Fi2XTEbkhSKYQelvHVYiLS0ZHlSRke9Xq9MljPnhVVV79zzJYX1J6OwghYLe2y4AAAAAElFTkSuQmCC',
          },
        },
      ],
    };
  }

  static #configLayerEntry(
    layerId: string,
    layerName: string,
    entryType: TypeLayerEntryType,
    metadata: unknown,
    source: unknown,
    style: unknown
  ): TypeLayerEntryConfig {
    return {
      layerId,
      // layerFilter: "province_en = 'Alberta' or province_en = 'Manitoba'",
      layerName,
      geometryType: 'point',
      entryType,
      metadata,
      attributions: ['Government of Canada, Natural Resources Canada, Lands and Minerals Sector'],
      bounds: [-110, 40, -70, 80],
      initialSettings: {
        controls: {
          highlight: true,
          hover: true,
          opacity: true,
          query: true,
          remove: true,
          table: true,
          visibility: true,
          zoom: true,
        },
        states: {
          visible: true,
          opacity: 1,
          hoverable: true,
          queryable: true,
        },
      },
      // temporalDimension: {},
      source,
      style,
    } as unknown as TypeLayerEntryConfig;
  }
}
