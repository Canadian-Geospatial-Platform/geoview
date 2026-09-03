import type { Coordinate } from 'ol/coordinate';

import { AbstractTester } from '../core/abstract-tester';
import { Test } from '../core/test';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { TypeOutfields } from 'geoview-core/api/types/map-schema-types';
import type { TypeLegendItem } from 'geoview-core/core/components/layers/types';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { getStoreLayerLegendLayerByPath } from 'geoview-core/core/stores/states/layer-state';
import type { GeometryApi } from 'geoview-core/geo/layer/geometry/geometry';

/**
 * Main GeoView Abstract Tester class.
 */
export abstract class GVAbstractTester extends AbstractTester {
  /** GLOBAL CONSTANTS FOR THE TESTS */

  /** Timeout value for waiting for layer registration. */
  static readonly LAYER_REGISTRATION_TIMEOUT_MS = 30000;

  /** Some long lat coordinates for map investigations */
  static readonly QUEBEC_LONLAT: Coordinate = [-71.356054449131, 46.78077550041052];
  static readonly OTTAWA_LONLAT: Coordinate = [-75.8, 45.24];
  static readonly ONTARIO_CENTER_LONLAT: Coordinate = [-88.31, 51.97];
  static readonly ALBERTA_CENTER_LONLAT: Coordinate = [-112, 51];

  /** Extent covering Ontario province in lonlat [minX, minY, maxX, maxY]. */
  static readonly ONTARIO_EXTENT: [number, number, number, number] = [-100, 50, -80, 57];

  /** Indicates if using animation to perform zoom operations */
  static readonly USE_ZOOM_ANIMATION = false;

  /** Bad url */
  static BAD_URL = 'https://badurl/oops';

  /**
   * Fake url acting like a WMS/WFS url for a GetCapabilities call - the proxy is a good url to use to fake this.
   * Something like https://google.ca will get turned into https://google.ca/?service=WFS&request=GetCapabilities and that's
   * not a 200 response and we can't test with that.
   * The Esri proxy is special in the sense that it returns a non-typical 200 with an error written inside the content.
   */
  static FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

  /** Airborne Radioactivity uuid */
  static AIRBORNE_RADIOACTIVITY_UUID = '21b821cf-0f1c-40ee-8925-eab12d357668';
  static AIRBORNE_RADIOACTIVITY_GROUP = `${GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID}/0`;
  static AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX = `${GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID}/0/1`;
  static AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME = 'Airborne Radioactivity';

  /** Airborne Radioactivity wms */
  static AIRBORNE_RADIOACTIVITY_WMS_URL = 'https://qgis-stage.cdtk.geogc.ca/ows/hc/airborne_radioactivity_en';
  static AIRBORNE_RADIOACTIVITY_WMS_LAYER_ID = 'AIRB_RAD';
  static AIRBORNE_RADIOACTIVITY_WMS_OUTFIELDS: TypeOutfields[] = [
    {
      name: 'pk_lyr_id',
      alias: 'pk_lyr_id',
      type: 'oid',
    },
    {
      name: 'Location_Emplacement',
      alias: 'Location_Emplacement',
      type: 'string',
    },
    {
      name: 'Province',
      alias: 'Province',
      type: 'string',
    },
    {
      name: 'Be7_Med_mBqM3',
      alias: 'Be7_Med_mBqM3',
      type: 'number',
    },
    {
      name: 'Be7_Max_mBqM3',
      alias: 'Be7_Max_mBqM3',
      type: 'number',
    },
    {
      name: 'Be7_Min_mBqM3',
      alias: 'Be7_Min_mBqM3',
      type: 'number',
    },
    {
      name: 'Be7_Readings_Lectures',
      alias: 'Be7_Readings_Lectures',
      type: 'string',
    },
    {
      name: 'Pb210_Med_mBqM3',
      alias: 'Pb210_Med_mBqM3',
      type: 'number',
    },
    {
      name: 'Pb210_Max_mBqM3',
      alias: 'Pb210_Max_mBqM3',
      type: 'number',
    },
    {
      name: 'Pb210_Min_mBqM3',
      alias: 'Pb210_Min_mBqM3',
      type: 'number',
    },
    {
      name: 'Pb210_Readings_Lectures',
      alias: 'Pb210_Readings_Lectures',
      type: 'string',
    },
    {
      name: 'I131_Med_mBqM3',
      alias: 'I131_Med_mBqM3',
      type: 'number',
    },
    {
      name: 'I131_Max_mBqM3',
      alias: 'I131_Max_mBqM3',
      type: 'number',
    },
    {
      name: 'I131_Min_mBqM3',
      alias: 'I131_Min_mBqM3',
      type: 'number',
    },
    {
      name: 'I131_Readings_Lectures',
      alias: 'I131_Readings_Lectures',
      type: 'string',
    },
    {
      name: 'Cs134_Med_mBqM3',
      alias: 'Cs134_Med_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs134_Max_mBqM3',
      alias: 'Cs134_Max_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs134_Min_mBqM3',
      alias: 'Cs134_Min_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs134_Readings_Lectures',
      alias: 'Cs134_Readings_Lectures',
      type: 'string',
    },
    {
      name: 'Cs137_Med_mBqM3',
      alias: 'Cs137_Med_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs137_Max_mBqM3',
      alias: 'Cs137_Max_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs137_Min_mBqM3',
      alias: 'Cs137_Min_mBqM3',
      type: 'number',
    },
    {
      name: 'Cs137_Readings_Lectures',
      alias: 'Cs137_Readings_Lectures',
      type: 'string',
    },
    {
      name: 'StartDate_DateDebut',
      alias: 'StartDate_DateDebut',
      type: 'string',
    },
    {
      name: 'EndDate_DateFin',
      alias: 'EndDate_DateFin',
      type: 'string',
    },
    {
      name: 'Graph_Graphique',
      alias: 'Graph_Graphique',
      type: 'string',
    },
  ];

  /** Geocore UUID with group layers having defaultVisibility set to false */
  static readonly GEOCORE_MARINE_FISHERIES_UUID = '44ef4d33-20b7-45fc-974c-d73a0a8fbae8';
  static readonly GEOCORE_MARINE_FISHERIES_LAYER_PATH = GVAbstractTester.GEOCORE_MARINE_FISHERIES_UUID + '/0';
  static readonly GEOCORE_MARINE_FISHERIES_LAYER_PATH_GROUP_NON_VISIBLE = GVAbstractTester.GEOCORE_MARINE_FISHERIES_LAYER_PATH + '/4';

  /** Historical Flood */
  static readonly HISTORICAL_FLOOD_URL_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/historical_flood_event_en/MapServer';
  static readonly HISTORICAL_FLOOD_LAYER_ID: string = '0';
  static readonly HISTORICAL_FLOOD_LAYER_NAME: string = 'Historical Flood Events';

  static readonly HISTORICAL_FLOOD_URL_FEATURE_SERVER: string = `${GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER}/${GVAbstractTester.HISTORICAL_FLOOD_LAYER_ID}`;

  static readonly HISTORICAL_FLOOD_OUTFIELDS: TypeOutfields[] = [
    {
      name: 'event_name',
      alias: 'Event name',
      type: 'string',
    },
    {
      name: 'year',
      alias: 'Year',
      type: 'number',
    },
    {
      name: 'event_summary',
      alias: 'Event summary',
      type: 'string',
    },
    {
      name: 'evacuation',
      alias: 'Evacuation',
      type: 'string',
    },
    {
      name: 'death',
      alias: 'Death',
      type: 'string',
    },
    {
      name: 'flood_cause',
      alias: 'Flood cause',
      type: 'string',
    },
    {
      name: 'flood_cause_description',
      alias: 'Flood cause description',
      type: 'string',
    },
    {
      name: 'start_date',
      alias: 'Start date',
      type: 'string',
    },
    {
      name: 'end_date',
      alias: 'End date',
      type: 'string',
    },
    {
      name: 'season',
      alias: 'Season',
      type: 'string',
    },
    {
      name: 'province_territory',
      alias: 'Province or territory',
      type: 'string',
    },
    {
      name: 'province_territory_description',
      alias: 'Province or territory description',
      type: 'string',
    },
    {
      name: 'source',
      alias: 'Source',
      type: 'string',
    },
    {
      name: 'source_description',
      alias: 'Source description',
      type: 'string',
    },
    {
      name: 'precipitation_analysis_url',
      alias: 'Precipitation analysis',
      type: 'string',
    },
    {
      name: 'precipitation_animation_url',
      alias: 'Precipitation animation',
      type: 'string',
    },
    {
      name: 'precipitation_data_url',
      alias: 'Precipitation data',
      type: 'string',
    },
    {
      name: 'uuid',
      alias: 'Unique ID',
      type: 'string',
    },
    {
      name: 'event_id',
      alias: 'Event ID',
      type: 'string',
    },
    {
      name: 'OBJECTID',
      alias: 'OBJECTID',
      type: 'oid',
    },
    {
      name: 'time_slider_date',
      alias: 'Time slider date',
      type: 'date',
    },
  ];

  static readonly HISTORICAL_FLOOD_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAbCAYAAAB4Kn/lAAACWklEQVR4AeyUz2vTYBjHn64ZsaXFVOdYMp3IDgVtcZBo6g/8dVGkFTwI6tHDdvEP8Nb2KCh48bCKR/U46IZMLw4RaSTRyZhSdDA61g5cXbGjtC515gnupU3eLPHgQVjIw/s87/N9Pu8PHt4e+EffDphc7LZXkUgkUiclKSPLsmqaJI2TSheHCjYgo4apzcFYvnrmRnrl8m0RDTY3Uy48kraBZWNXrf3xcQSVLlyHb8NHod7Hw89whBR5cWxgn64LG/0HTJgXgJPGBi7MzqZC759r4dWKU42neRsYq2q12pWB/ANgW00MuywajQpdEw4BFVwsFsvAMGPCi8ekrMXuglbsPM+FQsuyKJaxW0iS4lDBqOttNDRmtdR1H6Xjl+DLrbuwcu0O3zhyLp0YGZl0OgEVjGLd78/Uzt7kcRGr1Y0OwUXqJ64mI4EAtbepYI7jkliErWaFdsaV2CloDkvJ0/G42DmPPhVsJEbXDx42Bvd/7dhF2AgGbbu2gc1r4AQRj+uOdVbYwChth/bi4MnMDei6+1Vgq7GLHzxBURSur4HRmhr6ndbTGRCfYTSzgEw4O70/voO/3Z6yKqhgn8+X7Xv11Kq1xbj4bm0afhkbsSap4EKhMMlUl3JD76atehIjNPJZAba6lEU9SfxxqGDMKao6xs7P5A7lH8K+hY+AIHw7wsbjtGd5AfBEwfmZ7FtVzaDeao5gFCJ8ffHTIPf6WW5g4p429CRd4SfuT/W/fJQNlL9KTlCs3RaMAuwSXEBRFEnRNAGfVQS+mZuzdQLqt8wVvCX82/H/A/8GAAD//xYEcgMAAAAGSURBVAMAimfKN/C2el8AAAAASUVORK5CYII=',
      name: 'freshet',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAbCAYAAAB4Kn/lAAACQElEQVR4AeyUX2vTUBTAT0dLNppCtzlm+jKElSDdoJpACiq+u05B8MEPYIs++SwIKz6IfgFp9hEGA1f3DUQaSUag7CF0IH1YY5nGSVpqRrTes7HQ5iZthvggGO7NPff8+eX+OSdT8Jee/2DvYCMfhSSKVUkQ2oV8vobyzdVVwaMECJHBMBisNz/tcq3OVvHzUbXU/fVAlSRJLRQK6wFciA4m0b0eC6a5DK3WddD3n0Oz+Vb4Yd/ZwR0Q80i7EHgkkkwsaxH6To5IdPsjMMcdQHr+tXZs2xU/OhKY5/mMP3BurgOZxVcQi8UqhmG0/faxYHI5JdJVdubW4fH3Z5zjJL14bmEHmLheqdfrNU85JISCMa2c7loVL0jTN8E4uO+FMUwPpmc+wlfblj2lTwgE4y3b/SdFvHm8IF8M4Mq/fHsMaZZV/bbzOQXGvHT6d0v7xqNzn8ARUw6PhxxVKciBAg9ct9ixHgb5Uroj6waA625QBqKgwFhhlsUR0+SGx+T+vMYFZQ0NnsyL5BEITia7kYLPnBLm2Tj6psGxWC2VOhz1CpktLe1BnNlrRyoQLM9Ls28AczWE56ln2d3TyvMUQwK1Yvx6nGmUV64+HXKjxRy/CdOJ7XcXqjxFUWSES4II/PI24H8Bd4Ajbj+fewFsSpbruh74L8ZlUCtGJXaEJ05OxPn0y0o2e0/Lr9w2s1fWzMsLZZmd2hIVVS2jX1gPBWPA+0ZD+6CqG+QjoqJpmdNOgKhH+7g+FjwucJLt3wP/BgAA//+APi1zAAAABklEQVQDAOMZyzfx7LbNAAAAAElFTkSuQmCC',
      name: 'heavy rain',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAACT0lEQVR4AeyT32vTUBTHT3drStsU9oOB7eb0oVImFAeJJAwfRNGnzSf/hvpntP9G+1/IBP+BqRumUNmDFosbQ5a+qNFt7ZomdPcbMkiTNEs32NPCPbn3nnvO+dx77j0zdEPfLSg00aVSqRC64FFeO3WKolRmRVFD74kbGF4L9LRclgZ0t97NvMhbVrYeBbsyCJBhJlP/K5Soy+ZoP/eMAIM+cByuiATBaV2Wa+ra2hbfrabIch3C/chirGawVQkQzE/pjgMbCsIW5n6ZCAKgLyxqv4UnVT33auNQeCl1088rJ6xYUSRpdJa6v3HAT+MNCJiRKuf5pipePcahIED+sWL1KLNOB8KKk5o/LOv0nfRjauXe0Le0Cv+A/GfLxHNY8y8EQKqqbvbYUlVPPyIE9zuEzbM0pHtml1b7O7TS+6CzRKLhtwuARqNRFReMNPiNw+bF/ld6ePxOXzA/NsTeT3m32Sx80rToEzmFZ1nSMRPDYgZ08/YpidYPHcF3Ne3t9t5eM2DkKsZOtCgI+UFyWY97Gje1eTdWZDcGwo5S1q9YjoiKu+G9zuXSNgZyrXWkxB1Hdjn7hBK2PTFdXucACC9m3ux4bSaORfOQZpLJq4HwYkTab+K5TiTwhQccAjvY8+mlLXAieBiG8XphsK0jmHsPUDuCtOJJz/U+v4edo4zxCwW12+0jPNlZ80uD14hTiChGCApStDuNnVZrE3YxGI5JKMhZ4T/UBgcm+sb3JRQjhM8L0PPlqVok6CISdo6nD7nQTdvHAk0bNMz+xkDnAAAA//+bPRxkAAAABklEQVQDAApH5DHHxiadAAAAAElFTkSuQmCC',
      name: 'coastal storm',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAUCAYAAAB8gkaAAAACYElEQVR4AeySX0hTcRTHj/Pqygx68WGLRFBYZNbo3rhLTBAiV7kyeqnoZdAcZCTUgy/FHPVQL5FRkFkYBtVbso1oFBQrbKt7YaQQA6WHcguE6I8J6obd74U72u93TSfik2Pn3t85v3O+n3MO10Kr+FuDFSzb4XDYXS6Xp1GSemRJ6sO7qaFBLEgycYpeIyCbKiuV+qZToeYTlwPu070duzwXAhvrJEWWZQWNmHD0UFEwTFBTvz/U3jVg29PqpbodzbSl1knOxsN07Mwtcnuvi1ojEwtNycHQuSyKaZfTGcbZ6BQC1TsPBvYePUtVtlq9U/YBsNt3k+bKy8PsHXwOZslmxZaTV2xHzg+21WhToFOsZ66ios+xu5Ws1g2oW9AA3N7itWk1HWwSB8uVlrZVVW/Vu993vJt8V2PU3tkvYkUQYgXM/G3yIYQXh1E2a0fmv4a1LRWEunXrtelNdLjJ8sk4rLBxsJJcTv31/VseMzPzh76MJ3XLBxc5oB46bBoHmxeE9M/JCV38XXSABgMHKHqnM/K8/1wGUFbAzB/7GKN5q5X7IjlYiSBEXj26qAM+vX4QLJudleLJpOfH1JSkAQmTmgGM2GRmnEbfPFQTicRdI2a8OVg8Hg9rwpsBGFaUnrcjIyqSU6lUmgTBH7nfTRBEjDVMPnTbp5ZNT/vZO/gWPFjThdmg5qPb32OKNNTrzbx8co2SwyF93VgbfKwbIKNBraTgbworyGAcCCVU1f55NOr/8OyG/8W9rmDs8aXg1/dP9XXjninJu0XDjEpMCcOqYf+DGDXLhhkCxbxXFfYXAAD//8C3ZaUAAAAGSURBVAMAEC7vKU/8IFQAAAAASUVORK5CYII=',
      name: 'beaver dam failure',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAACaUlEQVR4AeSTTWgTQRSAX5rddtPmENBLCuJBJFYJBLMQCZ5y6SUt6EEI1Fvc2IN4qeBFE6SIiCIqSFMLgpfiQQ9uoNRDheJPVnahUkRz8GhzUfQQml12l7pvyYTZSTdsf+ilIW/nzbz35ps3894AHNDvEIISicToftxu36vLimIlFo3+wnGvMF8Qbm7ksmVj4QHYW1vl88lkei+wbUGZTEZCiF6cAvPoETAe3wFzcFDeV1DnTSS7cAEgIrh7m8ePgTV9OZ4RxSpmhtmeS6Vk50CqK51119nn05NRLBbLW1cKacyEjtHHc2Bdyktmakw1rk6V9ReP8sbcvbQrszek9tmkjAehY2jdA3KzsayKfeok7dPV9cJFaN2aAYTiQbpyZgz02ZtxK5eVMNtuAKV4QI1GYwNCIXno+m0Qni6AsLwC0NYpd0ftXKej9fz1a0XAt8XrZY0eEBoVVS0pmhbiV79Mcs8XtWhhGoTFN2gKJPbkOJjDw1XWuQdEHOr1uqwoiohQ7pXc5H//Iaa+IxYOWFZPk/uC2N3MkRF2yX9++kTcfW/KIygoTkqdivVVrQGuyRqDgThO4799Z2O3neMVcz9+briFRXkEAvGbm6XwykcqzF8Na18hbNs11iMQ6MP6usa/W60Jn1U23jNHO1bqJ1WteAzOJBDI8YP62toE97CqYanj9eAaEZwjhL/7pIbZk3V6DAzCICx37vVSaag403QbGpt67mUT59z9Z/N/2+0SZo++rOwIhMEObN7prVFs6MjSezHydnniX6slYqOzBYD+RHYMIoHY0Hh6lH4A4r9rENkg6HhgoP8AAAD//4UdvOgAAAAGSURBVAMASOXnMQcKbOYAAAAASUVORK5CYII=',
      name: 'frazil',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAbCAYAAAB4Kn/lAAACS0lEQVR4AeyUQUsbQRTHX4oQFZtuox5Mm4glkvQgrOzQTYoXoVIssbfcchAKycdQP0b6BTwEKU16sygFabJ2F0Uh3WAJmrQJphdJvIRq2nlLNpCdyWZb6KHQsG9m3sx/fzP75r3cgb/0+w/uBXZoKCKRyNpTQjZlWVZlSaoZPSHpUCjk61E4A1twRBRzAb8/u7S8vBGPx6XE+vpMIpGQnq+uJoWJiW+4IYdpTA0Ey/RUjxcXY89WViA4Pw8ejwfcbrdhD/1+eJVKwb3JyQ36BUmDZGm4YBTPzs0lo9GoRd7vvojFwCsI6aWFBal/BYALpqKkKIq0s3/wCx4Fg/BjfHw4GC9lyuv1TU1P21O7q+FwGEdMOLgn7nQ6M6h2bDc3PquWC75LL8oq/F2fAZdKpdpFuVxvNpuOWN8bDXDd3mpWMQM2BC5XrnF5aQyHNbquA4yOvrbquOCrVmvrw95e/Wu1atX3+fl8Hi4qFa1QKOT6FqjDBWM4rq6vyafDQyphHwwTQj8fHb1TFIWwisF5DIIgxKyXiLA3OzuQyWS0YrGYKhwfr/GgOMc9MVbSbCCQfiLLqDGs3W5D8eSkXj4/f4CnpMbE1RB2GwaMBUIrKS2KovH/0NX1OgxTz7EZMOD7Y2NpQojktPIGsRnwz5GRGuYmXtCgl5zMM2BFVVM1XSeZ7e36+91d+HJ2BrhJy2HBmJsyYFw4OD3VFE3zVarVlwf7+1uYBW+zWY1XYajnGRdsCjHxP6rqJs0AgmaXXuY7Zm8LNkV/0v974F8AAAD//0IVDqMAAAAGSURBVAMAjjPHN6HPFSkAAAAASUVORK5CYII=',
      name: 'dam failure',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAbCAYAAAB4Kn/lAAACNUlEQVR4AeyUXW7aQBDHx5SYQsAhCaEE1KK0SEhR8lDZklHVKzTHcI6R9hhwjfQIfQAJS1HpQ92HUqU0oNRpnQ8+bcfZsbTI8S4EKcpDpFi2Z2fmvz/Prnc3Ag90PYGnEzt3Kt7v7srvFOWjqqpNVZY93ypKFeNTwozGTDCBaEIq3VwtbB28Km3LxZ23gDZXLPlxlXxgBtMPc8EIldJr1dxWCVbWMrAkPodoZMm3y9IqvCzvQPpFQZsHZ8A4TPGZWE1ncj7I/zzntZ7NQzwpaZVK5QMnDQzYTiRkaWM+lII2CkXwPO+A+kHLgElSSySTxNx94xSB48g8JQsmQr8DT82JibEElMvlfDjFggG6zrUd1s30J+MBN8eABdfV7eGYKw4Hh/0rgGhUNwzjJJyLhANeLHZodn6Fw1x/0L8AIIXwkgy40WjUJu5EP/9n8vTTGOYts6dbl5efpsFAgwFjzrKsPbN3rJ+0DbAnIwwxj9n52UUdbxpQzAWjmFSuDIf9/ePvX+G38Q2wQuxAn3hqZXM9ldKoH7ZcMBUReK2h68Lp2WkBKwyulmzxNbhkc+BOpfqgnQumQhwBbVOLZ0f+zTbYonhIY0G7EDjYIdiOLydBymQ3eYfRvcD9i/9gj8cgOM5COy9Y1K2257iAmwJ/JK6YXqetj0aDvfrREXPCLVyxQDYCWSHd7o/WZ/NPu+ac/VXIz1Xq9fr95hirIisk79tmc/9Lq6XfGk7IWbjiUL873ccHvgEAAP//jD10+AAAAAZJREFUAwAOwtc3slKopAAAAABJRU5ErkJggg==',
      name: 'municipal water main break',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAYCAYAAADkgu3FAAACb0lEQVR4AeyTT2jTcBTHX0xBlIE9qNDdRLBF6cVEEjYR2djwsFIPrkO9KErrUCLiUPDSxD+I4EUP05YKvfiHYj1MERlsigxJMIGxUljVuXmwxT8HZaAUVrLfCwu0v2ZLtsEOYyG/vr783vt+Xl5+bxOs0bUBshodDAZbcYmiGDkYDnPWQ5efZbUOxQVBiPtbWnSR2/O9N8oNHerarwscZwo8n1qK5RmElfv9/qH+Ux2pzOCFwJ0bp+FkrBOk81F4lh2A/jNdcQIsYzFOQM+gOZaVr0oR7kj3AdixfVuD1patmwGf30yeCGAxDZsLjicQtqu3r72nTdy7kOZswvt2QWd7iMN4oC5PIJIT7+7giXG/j/cdBqZajdCRnkCh3Ts5ul20kO1jnMmyPbZvW0+gyVLZjvdkQ8FWoA+FJxBRr/z/VyXG/cY4UlilVGqsblEQDmMbz8vkw+qxY2IAT5Y7BuDLdBmYWs2gY5tAOHhkHkwcxoFLR5OZ++c4nBc60cn/9fsvvH03Ab5aTab3m0BgmnEyD9Yw4nHGj0snOfkIGR7VYeR9MT1WKLi/EcswykTxq5MWPM6NQDR2C94MfwQU/jbzA3AVitNw994LyOc1RdP1hFNy0xt90HU591y1hOoTUDyX19KaYTAPsqOJs9JDQ7qWNS5eTr1KXn+qTBVmeMytz6n/3wSyNn2+BFaIJwh9rJqIG39mZxX0NY0ANY0nllfHxyMIGHNoF8bayxFEBNKTUz8T8u0nVmsGH70GhrSUPrK2iBfrCMJEGyZdycDnTxVFVdWX+Hyla1EQCiJMMwwGW4P+ataSoNUI07nrDzQPAAD//zK3WLEAAAAGSURBVAMAPCHpMetySD8AAAAASUVORK5CYII=',
      name: 'unknown',
      isVisible: true,
    },
  ];

  /** Forest Industry Hotspots */
  static readonly FOREST_INDUSTRY_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/forest_industry_hotspots_en/MapServer';
  static readonly FOREST_INDUSTRY_LAYER_ID: string = '0';
  static readonly FOREST_INDUSTRY_LAYER_NAME: string = 'Location of mill facilities';

  static readonly FOREST_INDUSTRY_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAeklEQVR4AZyPQQ5FQBBE5/87OBFW4iysWbPmLGKFEzkEr0hLRyyE1NPd1TVk/uHl8zlY8oMJZijgkv+iFhWbBGKoQQcpIfhgjhOBSX1mgw9uZrr6s94HR8wVTOoHG3yww2xgAV2mpfZwyAdlaKHLpAw6SDl1D57uw3sHAAD//6HK3mIAAAAGSURBVAMAWeIPFUBE16wAAAAASUVORK5CYII=',
      name: 'Mills',
      isVisible: true,
    },
  ];

  /** Low Head Hydro Database */
  static readonly LOW_HEAD_HYDRO_DATABASE: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/Low_Head_Hydro_Database_en/MapServer';
  static readonly LOW_HEAD_HYDRO_DATABASE_YUKON_ID: string = '1';

  /** EsriDynamic with Raster Layers */
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_UUID: string = 'ac2096a6-7b4a-464e-9e08-eca7873dd88c';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_GROUP: string = '0';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM: string = '0/1';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_MINERALS: string = '0/2';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY: string = '0/3';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES: string = '0/4';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE: string = '0/5';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE: string = '0/6';
  static readonly ESRI_DYNAMIC_LABOUR_FORCE_PETROLEUM_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDozM4mKM6mDtopKMl0sERCu7I5b6g43OlGh6GVQWX8OyFqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kM25iIiuEa5f7hWyh6frgAAAD//+AwBAcAAAAGSURBVAMAvFc+KYtCIWgAAAAASUVORK5CYII=',
      name: '< 5%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUQQoAIAgEt/7TG6M39qAy8eLVzZvCKgguyxzs+FyphkfCsoJLePZEVLByhrajRhlS+PS4GCoGqhVDCp8e5zJsYyEqiddE7h++BaPnhwsAAP//QCgD9wAAAAZJREFUAwAnAT4piTIVzwAAAABJRU5ErkJggg==',
      name: '5 - 10%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUElEQVR4AeyQMQ4AIAgDTz/pG32lViddrWwQykDSprnK5wkNHCrriqvh6PAqldl7Be6PeTLQBCh7MhQEc5OhCVD2WIalwauAguZsuB6OFAcTAAD//7H06c4AAAAGSURBVAMAK34vKc+QpgoAAAAASUVORK5CYII=',
      name: '10 - 15%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo2O4oDO5oGtopKMl0sERCu7I5b6g43OlGh6GVQWXcC8gKoaxdoa2EUcZigB5XgwJQexiKALkeS7DMYGoGK5R7h++haLnhwsAAP//SFI/kAAAAAZJREFUAwDD8S8pNjKTYAAAAABJRU5ErkJggg==',
      name: '15 - 25%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo1O6hbO4hVtqpKMl0sERCu7I5b6g43OlGh6GVQWXcE8gKoaxdoa2EUcZigB5XgwJQexiKALkeS7DsYCoGK5R7h++haLnhwsAAP//ME11LgAAAAZJREFUAwDWVi8pjcJ/KAAAAABJRU5ErkJggg==',
      name: '> 25%',
      isVisible: true,
    },
  ];

  static readonly ESRI_DYNAMIC_LABOUR_FORCE_MINERALS_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDo1M4j4M7j1topKMl0sERCu7I5b6g43OlGh6GVQWX8KyNqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kM2xyIiuEa5f7hWyh6frgAAAD//4FSeJIAAAAGSURBVAMAhG4+KZVnLzkAAAAASUVORK5CYII=',
      name: '< 5%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDo5M4pGM4pJtopKMl0sERCu7I5b6g43OlGh6GVQWX8MyNqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kM2xqIiuEa5f7hWyh6frgAAAD//0ZA9ncAAAAGSURBVAMAtWM+KdUoI64AAAAASUVORK5CYII=',
      name: '5 - 10%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyUMQ4AIAgDq9/y/b4LCxsrlQ1CGUhomhvY+FythsawqpASGi6qYpjoZBgbcYyhCJDnw5AQxB6GIkCe9zJcOKiK4RaV/qEvFLkfHgAAAP//aH6fJwAAAAZJREFUAwDmQy8pZwTmEgAAAABJRU5ErkJggg==',
      name: '10 - 15%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUMQ4AIAgDq6/0L87+xV9qZWOlskEoAwlNcwMdnyvV8DCsKriEGwtRMYy1M7SNOMpQBMjzYkgIYhdDESDPcxkOTETFcI1y//AtFD0/XAAAAP//dT3YpgAAAAZJREFUAwDl5i8pqgLWdwAAAABJRU5ErkJggg==',
      name: '15 - 25%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo/u5jWO4jQNqpKMl0sERCu7I5b6g43OlGh6GVQWXcGIgKoaxdoa2EUcZigB5XgwJQexiKALkeS7DhY2oGK5R7h++haLnhwsAAP//yNMpAQAAAAZJREFUAwDbeC8pTXvMHwAAAABJRU5ErkJggg==',
      name: '> 25%',
      isVisible: true,
    },
  ];

  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FORESTRY_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDo/u4hIO7hANppKMl0sERCu7I5b6g43OlGh6GVQWXcJ+FqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kMR5uIiuEa5f7hWyh6frgAAAD//xyRtZ4AAAAGSURBVAMArQ8+KQFIbpoAAAAASUVORK5CYII=',
      name: '< 5%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDo3u6hWO4hYNqpKMl0sERCu7I5b6g43OlGh6GVQWXcJ+JqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kMR1uIiuEa5f7hWyh6frgAAAD//2eKdqQAAAAGSURBVAMAvbc+KZoclq0AAAAASUVORK5CYII=',
      name: '5 - 10%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo2O4k9O6k2topKMl0sERCu7I5b6g43OlGh6GVQWXcG4gKoaxdoa2EUcZigB5XgwJQexiKALkeS7DNYCoGK5R7h++haLnhwsAAP//tN5HGwAAAAZJREFUAwCgKi8pnn0RXAAAAABJRU5ErkJggg==',
      name: '10 - 15%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo0u5iiO6ilNppKMl0sERCu7I5b6g43OlGh6GVQWXcCwgKoaxdoa2EUcZigB5XgwJQexiKALkeS7DPYGoGK5R7h++haLnhwsAAP//NVz9FwAAAAZJREFUAwBCvS8pGlc2mgAAAABJRU5ErkJggg==',
      name: '15 - 25%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVUlEQVR4AeyUsREAIAgDo7M4omM4ortopKMl0sERCu7I5b6g43OlGh6GVQWXcEwgKoaxdoa2EUcZigB5XgwJQexiKALkeS7DvYCoGK5R7h++haLnhwsAAP//mZ5kWwAAAAZJREFUAwCC+i8pGc9D2QAAAABJRU5ErkJggg==',
      name: '> 25%',
      isVisible: true,
    },
  ];

  static readonly ESRI_DYNAMIC_LABOUR_FORCE_FISHERIES_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDowM5hIM7hAtppKMl0sERCu7I5b6g43OlGh6GVQWXcO2DqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kM52iIiuEa5f7hWyh6frgAAAD//4SjC48AAAAGSURBVAMAZd4+KT7693QAAAAASUVORK5CYII=',
      name: '< 5%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAVklEQVR4AeyUsREAIAgDo/u5jWO4jQNqpKMl0sERCu7I5b6g43OlGh6GVQWXcO6DqBjG2hnaRhxlKALkeTEkBLGLoQiQ57kM12iIiuEa5f7hWyh6frgAAAD//4wP81gAAAAGSURBVAMAMRI+KeIgAKUAAAAASUVORK5CYII=',
      name: '5 - 10%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAU0lEQVR4AeyUQQoAIQwDx/3wvsUXa+qt10ZvLQ1CISHMwY/L8zRwqawrcsNfeVWpTWwOjIupDjQByt4MBcHcZmgClP0xwzmgKpCZ9B8OOMfqS8wGAAD//5UU6aYAAAAGSURBVAMA62UvKamuBJ0AAAAASUVORK5CYII=',
      name: '10 - 15%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyQsQ0AIQwD738/ekakZ0BwOmgxdIlyTaRY1v1cnqeBQ2Vd2BuWBqeoTeweGBeTDDQF6j0dSoK56dAUqPfHDnuFU+BDszaMg4PiYAIAAP//GwRoOAAAAAZJREFUAwBDTS8pFy8iLwAAAABJRU5ErkJggg==',
      name: '15 - 25%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAU0lEQVR4AeyQsQ0AIQwD738WRmQMRmQXcDpoMXSJck2kWNb9XJ6ngUNlXdgblgqnqE3sHhgXkww0Beo9HUqCuenQFKj3xw57g1PgQ7M2jIOD4mACAAD//2VjptAAAAAGSURBVAMAZPovKerbXT0AAAAASUVORK5CYII=',
      name: '> 25%',
      isVisible: true,
    },
  ];

  static readonly ESRI_DYNAMIC_LABOUR_FORCE_AGRICULTURE_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyUMQ4AIAgDi0/z4X4NKxsrlQ1CGUhomhtY+Fyths6wqpASuh9UxTDRyTA24hhDESDPhyEhiD0MRYA872VotlEVwxmV/uFbKHp+uAAAAP//EjPmNgAAAAZJREFUAwDqLz4pP8ZI/gAAAABJRU5ErkJggg==',
      name: '< 5%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyUMQ4AIAgDi2/2Gf4ZKxsrlQ1CGUhomhtY+Fyths6wqpASum9UxTDRyTA24hhDESDPhyEhiD0MRYA872VodlAVwxmV/uFbKHp+uAAAAP//GCSxLQAAAAZJREFUAwBU2T4pcyJ+NQAAAABJRU5ErkJggg==',
      name: '5 - 10%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAU0lEQVR4AeyUMQ4AIAgDq8/w/2/jG1rYWKlsEMpAQtPcwMbnajW8DKsKKaEZUBXDRCfD2IhjDEWAPB+GhCD2MBQB8ryX4TlAVQy3qPQPfaHI/fAAAAD//4mmM+8AAAAGSURBVAMALvgvKR32MQoAAAAASUVORK5CYII=',
      name: '10 - 15%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyUMQ4AIAgDq6/0ifxSCxsrlQ1CGUhomhvY+FythpdhVSElNAOqYpjoZBgbcYyhCJDnw5AQxB6GIkCe9zI8B6iK4RaV/qEvFLkfHgAAAP//42VpGwAAAAZJREFUAwCxLy8pcBPjTQAAAABJRU5ErkJggg==',
      name: '15 - 25%',
      isVisible: true,
    },
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAUklEQVR4AeyUMQ4AIAgDq2/2GfxZCxsrlQ1CGUhomhvY+FythpdhVSElPAeoimGik2FsxDGGIkCeD0NCEHsYigB53svQDKiK4RaV/qEvFLkfHgAAAP//CIEZRgAAAAZJREFUAwDDlC8peC6aqwAAAABJRU5ErkJggg==',
      name: '> 25%',
      isVisible: true,
    },
  ];

  static readonly ESRI_DYNAMIC_LABOUR_FORCE_CANECUMENE_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Polygon',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAADpElEQVR4Aeyaa0vzQBCFZ+Pl//8bRURRUBQUUUFBsdBilXqp9Vbv3XefeZmwqUKR9JItSoazM5Nkz9mTNB/crFar+Xq97huNhm82m/7i4sK3Wi1/dXXlb29vfbvd9p1Oxz88PPjn52ff7Xb96+urf39/95+fn/7r68tX4S8LJKTX60mMgZzmID2L/py6XScT/ssgEwdkIWdIjzxGxhbxeZPUUhASHhV5enqS8AhpPD4+KobHShiDcdzf3ws5SHQ6Hc2pjTLu7u6EBYwX7puQubk5mZ+fF3B2dlaccxq4wsWIDe+HhPdEXl5eVKiJRAyTjDrCuysfHx+xDikIgahz/4k7V20sqAiJCmG1eebBUEvy0F8tnEAIkaSKQDpDBE4gAgy1JI/cEUQgKkkVgXTuCCIQE2pJHuqIPVaISVJFIK2OIAQRU+NI0kJwI47gUpKHfhD/hFTIu+lyhJecxwus0CL/iop+R/jpRQjxq6srdLJ+R3ACEWAJbhO9NHcEETgzUTYlJs8dQQRiStxropeqI/ZYgRNlU2JydQQBf46UWMVhXpp/EHEEZ4Z583HeKxfCiz4VQhBBjHMVhzlX7ggicGWYNx/nvVQIAhBCjHPyMnP1c9XviL3o/c0yE436Wlt8m0e/I1YErVF1ZNHhC8I1d4QizlBMIRBAwBvMHUEExRREwBHyhPFWRyggAuSkFML4GqojCDBlKYiAI5xNBONkHYE8iw8S+h1hYEXUphBwLjhCgbBiCiLgCGdbfMa5IySI4aQKxEAKcCXgTRSEUBh4h4qcgIhvjlBEBFERngNpIMJ4g/qrRRERxMA7VOQEyMPbUL8jJIgAK8JzIA3ja2JyRxBBk3/EpxDGF0RM7ggJuxqWlpZkYWFBFhcXhfHy8rKsrKzI6uqqrK2tyfr6umxsbMjm5qZsbW3J9va27OzsyO7uruzt7cn+/r4cHBzI4eGhHB0dyfHxsZycnMjp6amcnZ1JrVaTer0ujUZDzs/PpdlsyuXlpbRaLbm+vpabmxtpt9vC7gm2gbCrotvt6i6Lt7c3YdeFc05mZmZ0MxC8EaOO4AQJRcTgCBgHPYJzY7TrqFtQk/D3EzrndOdRaOvhXHGHRZZlQkDUOaeEnXNaszq9eC7G6ggDyDGxITVyMA765CB9Q2rkYBz0yUH6htTIwTjoW06fHKRmyJggp8+44AgFaxpSi4M6eYzcjBykFwd18hg5jxykFwf1/pzzqINxj5w6tX8AAAD//9pUnF4AAAAGSURBVAMAL7U+sAcCQAwAAAAASUVORK5CYII=',
      name: '',
      isVisible: true,
    },
  ];

  /** CESI */
  static readonly CESI_MAP_SERVER: string = 'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer';
  static readonly CESI_GROUP_0_LAYER_NAME: string = 'Water quantity';

  /** Toronto */
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_URL: string =
    'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Toronto_Neighbourhoods/FeatureServer';
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_ID: string = '0';
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_NAME: string = 'Toronto_Neighbourhoods';
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_FEATURE_SERVER: string = `${GVAbstractTester.FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_URL}/${GVAbstractTester.FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_ID}`;
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_OUTFIELDS: TypeOutfields[] = [
    {
      name: 'FID',
      alias: 'FID',
      type: 'oid',
    },
    {
      name: 'F_id1',
      alias: '_id1',
      type: 'number',
    },
    {
      name: 'AREA_ID2',
      alias: 'AREA_ID2',
      type: 'number',
    },
    {
      name: 'AREA_AT3',
      alias: 'AREA_AT3',
      type: 'number',
    },
    {
      name: 'PARENT_4',
      alias: 'PARENT_4',
      type: 'number',
    },
    {
      name: 'AREA_SH5',
      alias: 'AREA_SH5',
      type: 'string',
    },
    {
      name: 'AREA_LO6',
      alias: 'AREA_LO6',
      type: 'string',
    },
    {
      name: 'AREA_NA7',
      alias: 'AREA_NA7',
      type: 'string',
    },
    {
      name: 'AREA_DE8',
      alias: 'AREA_DE8',
      type: 'string',
    },
    {
      name: 'CLASSIF9',
      alias: 'CLASSIF9',
      type: 'string',
    },
    {
      name: 'CLASSIF10',
      alias: 'CLASSIF10',
      type: 'string',
    },
    {
      name: 'OBJECTI11',
      alias: 'OBJECTI11',
      type: 'number',
    },
    {
      name: 'Shape__Area',
      alias: 'Shape__Area',
      type: 'number',
    },
    {
      name: 'Shape__Length',
      alias: 'Shape__Length',
      type: 'number',
    },
  ];

  /** Elevation */
  static readonly IMAGE_SERVER_ELEVATION_URL: string =
    'https://ws.geoservices.lrc.gov.on.ca/arcgis5/rest/services/Elevation/FRI_CHM_SPL/ImageServer';
  static readonly IMAGE_SERVER_ELEVATION_LAYER_ID: string = 'FRI_CHM_SPL';

  /** USA Image Server */
  static readonly IMAGE_SERVER_USA_URL: string = 'https://sampleserver6.arcgisonline.com/ArcGIS/rest/services/USA/MapServer';
  static readonly IMAGE_SERVER_USA_LAYER_ID_CITIES: string = '0';
  static readonly IMAGE_SERVER_USA_LAYER_ID_ROADS: string = '1';

  /** OWS Mundialis */
  static readonly OWS_MUNDIALIS: string = 'https://ows.mundialis.de/services/service'; // NOTE: Doesn't support EPSG:3978
  static readonly OWS_MUNDIALIS_LAYER_ID: string = 'Dark';
  static readonly OWS_MUNDIALIS_ICON_IMAGE: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAMklEQVR4AezSIQ4AAAgCQMeL+P/ntBuRJm5GCDdAsp2PMl8K76AxjKEgkNkIaCvy0HAAAAD//5nQepcAAAAGSURBVAMA0jAfVcgPVAkAAAAASUVORK5CYII=';

  /** Datacube MSI */
  static readonly DATACUBE_MSI: string = 'https://datacube.services.geo.ca/ows/msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI: string = 'msi';
  static readonly DATACUBE_MSI_LAYER_NAME_MSI_OR_MORE: string = 'msi-94-or-more';
  static readonly DATACUBE_MSI_LAYERS_MSI_GET_CAP: string = `${GVAbstractTester.DATACUBE_MSI}?request=GetCapabilities&amp;service=wms&amp;version=1.3.0&amp;layers=msi`;
  static readonly DATACUBE_MSI_ICON_IMAGE: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAAXCAYAAACiRWVyAAAQAElEQVR4AeyZB5CWRQ/H8z/wUFAEYXTsomNvYG/oITZE9AAF7GDFz3Y27L137F2xgkqVrogi0mzgKNil2LCMgNLh7r788ty+vKif1Lnxc+4dcrubTbLZbDbJPhSUV/2qLPAvskCB+c/343/NaFcGIAw5tFVQZYHKtEA4tKRYU5JJKw4Ik0RTBVUWqFQLhEOnaFpWXm4L58y28tkzrWwZAZ4FzosMdpBk0q+CKgtUlgXCodNiC+fMsvv7D7VOA0balQNG2BVLCdB2ctpHBg61snlzk7iqtsoClW6BxRy6WlmZTSpfxYZXq2ejq9VxqLtUMMZp4ZlSVmjVy0srfROVtWDKOmVuJ4B1E47+yoAkj7a0tDTeNchlTLv88M/gTPvAfgBaJRz9FYXFHNq87K2hclvdFlqt8jKraaVLCWVOX2qFzluOkCVolTbAhhYsWGDAwoUL//GHJ7mBfG8FBQUGeHexf+yBPYFMe6S/LCApZ4dq1aoFK7KkDI+tcPSY8D+sx7rezfHRB+BLLXz5Y/ArCvny6APITC39P4L0ZxtKGe6PtMszXtyhy82NIitzpyxzaeXeLg1AWxa0zrSEf2xWkq/jkr1dZZVVrHr16gFStjEpa5cgqtKn0Z1Ff/31V/vpp5/oLgbsIzm6tHx7YA1J9uOPP1qnTp1s1qxZJmX2YjHsxRrQMZYUtkt92gRSpoMkg09aNE40K9JKi+RJCj2RJ4nmLyHp/csvvxgAETiA/orC4g69otKWgl+SEVUk2WeffWYXXnihnXrqqXbPPffY/PnzQwIRBxqiSn40YtOMwUPDGAZw0NOn/V9ziZ4WHuTQMk688INjjj54gP68efPo2oMPPmgXX3xx9FkrOv7nkksusffee897ZshgLl8O64AHR8sY4vwWPLhXXnnFPvzwQ1t9dc+Xnr0k2fTp0+2MM86w1157Lec8H3zwgT300EOwxJrIYl0gyeJynH322TbN+SFkDh1Sy97A0yY8csDRJmAMDXwAeHCc22+//RaZlnlwaY4WPZLcZMN7773Xbr/9dkhD70ST+JmAl3XgzcfTB8ccNImWttIdGgWIML///rsdc8wxETkOPuQQdLG0WVItNEQV+vAkAE8kBBIOGimLCswzRiDzjAH6UkYjyaBBPnNW8ZMUpQQ45iRFJkm8rGn+Y96bP/1bb731rFatWjk89IC0SA68yGZ9CJNsWsYJP2DAAOvozgsuzX399df28MMPW8eOHW3GjBlM2dixY61nz57R56ChZU1AyvaLzI022siqFWTHzTjpAB06wStlkRwccgApkyEpF4iYB+BhYfQ67rjj6Ib9Eh8tSNaDPgG4tCZ9SQYNOknK2Rz+xAM9Y9akDy084AAp48t2aJX3QyFW+/jjjw2nvuiii+yoI480Isgaa6wRUWTcuHH25ZdfRuSBTqpQ1g/k/ffft0ceecQGDRqUM/Bbb72VKwF++OEHGz58OEtEFBs9erRNnDgx+mltbvfQoUND/pgxY2IOBjIGhzNs2DB78sknIyJKinkcqEuXLvbOO+/EWBIsARiUTrNmzWydddahG7r17tPHnnjiCUOmpOBDt/vvv9/y14VfyvYoyb744ovgKSoqClmSosVerVq1sgYNGthtt90WOA62Ro0a0eeAoXnxpZfsscceM2zBRJ06deyggw6yRPfJJ5/Yo48+al27drVnn33Wvvvuu3BE1uXC9PHsQNSVFumE7XCkSZMmBe/L3bsbERL8iy++aJwTMsePHx/7BM/akuzdd98Nnq5du9kLL7wAOhw40WDbXr17B81XX30V/JIicnOxkfvpp58GHh1Yg6zE3B9tV+kOjULsaLfddrN1113X9t1338UOd6o75IEHHmgXXHBBRJ8mTZqEQeC788477fjjj7fJkyfbVVddZSeeeCKi4vA4QAbdunWLw5s5cyZDO//88+3zzz+PPgdAB2cl5X377bfWtm1b696jB2jr1auX7bzzzsYBPf/883b44YcHfu7cuda8eXPr4w763HPP2U033ZRzDgwaRP7n3HPPtSGvv+49szZt2tijfvFw3BtvvDFwtHfffbeRnktKSqyHR1ZJ4fzISQfM+nvssYfVdUdEZylzaGgYYwccb/bs2VZYWCNXquEYJ510ko14++1wMGxFuQEf+lOyfPTRR1ZcXGw4BeXezTffbDU9q7zxxht28sknGzSPubNfffXVxg9eygHsT+Bo37591L7Pux3gl2TffPNNBCdkp7oYHknGpT7hhBNswoQJXlqeYk899RRiDblStq9rrrnG+volonw69NBDDaeGiPKKi4tc9IEHxz/zzDPDhp07dzZsCi22Y77SHVpSbIZo0q9f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';

  static readonly DATACUBE_RING_FIRE: string = 'https://datacube.services.geo.ca/web/aerial.xml';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_HALIFAX: string = 'halifax';
  static readonly DATACUBE_RING_FIRE_HALIFAX_ICON_IMAGE: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV4AAABICAYAAAC+050oAAAOlUlEQVR4AeydCawd0x/Hf7+GaEgpQgghtCGEiLVNLalIixBiKSpEY0lLQyqkao99iYYQW4Q8IWgJIXaxpA2xLyEEVUsIIfYQQvr+7zPzzr9nTufed/vezH33Xt/mnfs7y2/OmfuZM7+eOzP3e8f0658IiIAIiEBbCYwx/RMBERABEWgrAQXetuLWYCIgAh1LoI07psDbRtgaSgREQAQgoMALBSUREAERaCMBBd42wtZQIiACq0ugN/0VeHvzuOpdiYAIdDABBd4OPjjaNREQgd4koMDbm8dV70oE6iSgvkdIQIF3hAC1uQiIgAisLgEF3tUlJn8REAERGCEBBd4RAtTmItApBLQf3UNAgbd7jpX2VAREoEcIKPD2yIHU2xABEegeAgq83XOstKfdSED7LAIlBBR4S6CoSgREQATqJKDAWyfdgb6feOIJO+qoo5TEoCPnAPNzYJrqr80EFHhrBn733Xfbgw8+qNRRDHQ8wpxkftZ8Cqj7EgIKvCVQ6qhydxszZoytscYatuaaa9paa61lY8eOtbXXXtvWWWcdGzdunK277ro2fvx422CDDWzDDTe0jTbayDbeeGPbZJNNbNNNN7XNNtvMNt98c9tiiy1syy23tK222somTJhgEydOtG222ca23XZb22677Wz77be3HXbYwXbccUfbaaedbOedd7ZddtnFdtttN9t9991t0qRJNnnyZJsyZYrtueeetvfee9s+++xjU6dOtX333df2228/mzZtmk2fPt0OOOAAO/DAA+2ggw6ygw8+2A455BA79NBD7bDDDrPDDz/cjjzyyGwld/TRR9vMmTPt2GOPteOOO86OP/54O+GEE2zWrFl24okn2kknnWSnnHKKzZ492+bMmWOnnXaazZ07104//XQ744wzbN68eXbmmWfaWWedZWeffbbNnz/fFixYYOeee66df/75dsEFF9hFF11kF198sV1yySV26aWX2uWXX25XXHGFXXXVVXb11Vfbtddea9ddd50tXLjQrr/+ervhhhvsxhtvtJtuusluvvlmu+WWW+y2226z22+/3e644w6788477a677rK+vj4jAN1zzz1277332n333Wf333+/LVq0KPsP86GHHrKHH37YHnnkEXv00Uftscces8cff9xY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';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_VICTORIA: string = 'victoria';

  /** Geomet (serves WMS and WFS) */
  static readonly GEOMET_URL: string = 'https://geo.weather.gc.ca/geomet';
  static readonly GEOMET_URL_CURRENT_COND_LAYER_ID: string = 'ec-msc:CURRENT_CONDITIONS';
  static readonly GEOMET_WFS_OUTFIELDS: TypeOutfields[] = [
    {
      name: 'name',
      alias: 'name',
      type: 'string',
    },
    {
      name: 'nom',
      alias: 'nom',
      type: 'string',
    },
    {
      name: 'station_en',
      alias: 'station_en',
      type: 'string',
    },
    {
      name: 'station_fr',
      alias: 'station_fr',
      type: 'string',
    },
    {
      name: 'icon',
      alias: 'icon',
      type: 'string',
    },
    {
      name: 'cond_en',
      alias: 'cond_en',
      type: 'string',
    },
    {
      name: 'cond_fr',
      alias: 'cond_fr',
      type: 'string',
    },
    {
      name: 'temp',
      alias: 'temp',
      type: 'string',
    },
    {
      name: 'dewpoint',
      alias: 'dewpoint',
      type: 'string',
    },
    {
      name: 'windchill',
      alias: 'windchill',
      type: 'string',
    },
    {
      name: 'pres_en',
      alias: 'pres_en',
      type: 'string',
    },
    {
      name: 'pres_fr',
      alias: 'pres_fr',
      type: 'string',
    },
    {
      name: 'prestnd_en',
      alias: 'prestnd_en',
      type: 'string',
    },
    {
      name: 'prestnd_fr',
      alias: 'prestnd_fr',
      type: 'string',
    },
    {
      name: 'rel_hum',
      alias: 'rel_hum',
      type: 'string',
    },
    {
      name: 'speed',
      alias: 'speed',
      type: 'string',
    },
    {
      name: 'gust',
      alias: 'gust',
      type: 'string',
    },
    {
      name: 'direction',
      alias: 'direction',
      type: 'string',
    },
    {
      name: 'bearing',
      alias: 'bearing',
      type: 'string',
    },
    {
      name: 'timestamp',
      alias: 'timestamp',
      type: 'string',
    },
    {
      name: 'url_en',
      alias: 'url_en',
      type: 'string',
    },
    {
      name: 'url_fr',
      alias: 'url_fr',
      type: 'string',
    },
    {
      name: 'national',
      alias: 'national',
      type: 'string',
    },
  ];

  /** WMS — Nonna service (CORS blocked, triggers proxy fallback) */
  static readonly NONNA_WMS_URL: string = 'https://nonna-geoserver.data.chs-shc.ca/geoserver/wms';
  static readonly NONNA_WMS_LAYER_ID: string = 'nonna:NONNA 10';

  /** WFS — Belgium Meteo service (CORS blocked, triggers proxy fallback) */
  static readonly BELGIUM_WFS_URL: string = 'https://opendata.meteo.be/service/aws/ows';

  /** WMTS — Taiwan NLSC service (CORS blocked, triggers proxy fallback) */
  static readonly TAIWAN_WMTS_URL: string = 'https://maps.nlsc.gov.tw/S_Maps/wmt';

  /** JSON endpoint (CORS blocked, triggers proxy fallback) */
  // GV Not working anymore, url got blocked by NRCan, have to find another public CORS example to replace this test..
  static readonly PUBLIC_JSON_URL_CORS: string = 'https://fantasy.premierleague.com/api/bootstrap-static/';

  /** WMTS — ArcGIS World Timezones sample service */
  static readonly WORLD_TIMEZONES_WMTS_URL: string =
    'https://sampleserver6.arcgisonline.com/arcgis/rest/services/WorldTimeZones/MapServer/WMTS';
  static readonly WORLD_TIMEZONES_WMTS_URL_LAYER_ID: string = '0';
  static readonly WORLD_TIMEZONES_WMTS_URL_MATRIX_SET_ID: string = 'default028mm';

  // GV: Can't add the icon property here, because it's a randomly generated color depending on the layers processed on the map
  static readonly GEOMET_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'Point',
      name: 'Current Conditions',
      isVisible: true,
    },
  ];

  /** Geojson */
  static readonly GEOJSON_METADATA_META: string = './datasets/geojson/metadata.meta';
  static readonly GEOJSON_METADATA_META_FILE: string = 'metadata.meta';
  static readonly GEOJSON_DATASET_ROOT: string = './datasets/geojson';
  static readonly GEOJSON_POLYGONS: string = 'polygons.json';
  static readonly GEOJSON_GEOMETRY_COLLECTION: string = 'geometrycollection.json';
  static readonly GEOJSON_POLYGONS_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'Polygon',
      icon: 'data:image/png;base64,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',
      name: 'Quebec',
      isVisible: true,
    },
    {
      geometryType: 'Polygon',
      icon: 'data:image/png;base64,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',
      name: 'Alberta',
      isVisible: false,
    },
    {
      geometryType: 'Polygon',
      icon: 'data:image/png;base64,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',
      name: 'Other provinces',
      isVisible: true,
    },
  ];

  static readonly GEOJSON_GEOMETRY_COLLECTION_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'GeometryCollection',
      name: 'Active',
      isVisible: true,
    },
    {
      geometryType: 'GeometryCollection',
      name: 'Inactive',
      isVisible: true,
    },
    {
      geometryType: 'GeometryCollection',
      name: 'Maintenance',
      isVisible: true,
    },
    {
      geometryType: 'GeometryCollection',
      name: 'Other',
      isVisible: true,
    },
  ];

  static readonly GEOJSON_POLYGONS_OUTFIELDS: TypeOutfields[] = [
    {
      name: 'Province',
      alias: 'Province',
      type: 'string',
    },
    {
      name: 'creationDate',
      alias: 'Creation Date',
      type: 'date',
    },
    {
      name: 'myImages',
      alias: 'My Images',
      type: 'string',
    },
  ];

  static readonly CSV_STATION_LIST: string = './datasets/csv-files/Station_List_Minus_HQ-MELCC.csv';
  static readonly CSV_STATION_LIST_FILE: string = 'Station_List_Minus_HQ-MELCC.csv';

  // GV: Can't add the icon property here, because it's a randomly generated color depending on the layers processed on the map
  static readonly CSV_STATION_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'Point',
      name: 'Station List CSV',
      isVisible: true,
    },
  ];

  static readonly PYGEOAPI_B6RYUVAKK5: string = 'https://b6ryuvakk5.execute-api.us-east-1.amazonaws.com/dev';
  static readonly PYGEOAPI_B6RYUVAKK5_LAKES: string = 'lakes';

  // GV: Can't add the icon property here, because it's a randomly generated color depending on the layers processed on the map
  static readonly PYGEOAPI_B6RYUVAKK5_LAKES_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'Polygon',
      name: 'lakes',
      isVisible: true,
    },
  ];

  static readonly WKB_SOUTH_AFRICA: string =
    '0103000000010000000500000054E3A59BC4602540643BDF4F8D1739C05C8FC2F5284C4140EC51B81E852B34C0D578E926316843406F1283C0CAD141C01B2FDD2406012B40A4703D0AD79343C054E3A59BC4602540643BDF4F8D1739C0';

  static readonly KML_TORNADO: string = './datasets/kml-files/CanadianNationalTornadoDatabase_1980-2009.kml';
  static readonly KML_TORNADO_FILE: string = 'CanadianNationalTornadoDatabase_1980-2009.kml';

  static readonly GEOTIFF_VEGETATION: string =
    'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/eo4ce/vegetation/vegetation-2020-fCOVER.tif';
  static readonly GEOTIFF_VEGETATION_FILE: string = 'vegetation-2020-fCOVER.tif';

  /** Vector Tiles (EPSG:3978 — CBMT Canadian Basemap Transport). */
  static readonly VECTOR_TILES_CBMT_3978_URL: string =
    'https://tiles.arcgis.com/tiles/HsjBaDykC1mjhXz9/arcgis/rest/services/CBMT_CBCT_3978_V_OSM/VectorTileServer';
  static readonly VECTOR_TILES_CBMT_3978_LAYER_NAME: string = 'CBMT 3978 Vector Tiles';

  /** XYZ Tiles — OpenStreetMap standard tile server. */
  static readonly XYZ_TILES_OSM_URL: string = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static readonly XYZ_TILES_OSM_LAYER_ID: string = 'OpenStreetMapXYZ';

  /** Water Network (has fields with coded value domains, e.g. "material" on layer 16). */
  static readonly WATER_NETWORK_MAP_SERVER: string = 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Water_Network/MapServer';
  static readonly WATER_NETWORK_LAYER_ID: string = '16';
  static readonly WATER_NETWORK_LAYER_NAME: string = 'Water Network';
  static readonly WATER_NETWORK_DOMAIN_FIELD_NAME: string = 'material';

  static readonly INITIAL_SETTINGS_CONFIG = {
    geoviewLayerId: 'geojsonLYR1',
    geoviewLayerName: 'GeoJSON Sample',
    metadataAccessPath: './datasets/geojson/metadata.meta',
    geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
    serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
    initialSettings: {
      controls: {
        highlight: false,
        zoom: false,
      },
    },
    listOfLayerEntryConfig: [
      {
        entryType: 'group',
        layerId: 'point-feature-group',
        layerName: 'Points & Icons',
        initialSettings: {
          controls: {
            remove: false,
          },
        },
        listOfLayerEntryConfig: [
          {
            layerId: 'points_1.json',
            layerName: 'Points 1',
            initialSettings: {
              controls: {
                highlight: true,
              },
            },
          },
        ],
      },
    ],
  };

  /** The API for the tests */
  #api: API;

  /** The Map Viewer for the tests */
  #mapViewer: MapViewer;

  /** The Controller Registry for the tests */
  #controllerRegistry: ControllerRegistry;

  /**
   * Constructs a GeoView specific tester.
   *
   * @param api - The api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super();

    // Keep the attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = controllerRegistry;
  }

  /**
   * Gets the shared api.
   *
   * @returns The shared api
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer.
   *
   * @returns The MapViewer
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the Map Id.
   *
   * @returns The Map Id
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }

  /**
   * Gets the geometry API from the map viewer.
   * @returns The geometry API instance
   */
  getGeometryApi(): GeometryApi {
    return this.getMapViewer().geometry;
  }

  /**
   * Gets the controller registry when the tester class needs to do something with controllers.
   *
   * @returns The controller registry
   */
  getControllersRegistry(): ControllerRegistry {
    return this.#controllerRegistry;
  }

  /**
   * Sets the MapViewer and the Controller registry for the current test.
   *
   * @param mapViewer - The MapViewer to set
   * @param controllerRegistry - The ControllerRegistry to set
   */
  reassignMapViewerAndControllers(mapViewer: MapViewer, controllerRegistry: ControllerRegistry): void {
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = controllerRegistry;
  }

  /**
   * Destroys the current map and creates a new one from the given config.
   *
   * Deletes the existing map viewer, creates a fresh instance via `createMapFromConfigFast`,
   * reassigns the tester's internal references, and waits for all layers to finish loading.
   *
   * @param test - The test instance used to log each step
   * @param mapId - The map identifier to destroy and recreate
   * @param mapConfig - The map configuration object (will be JSON-stringified)
   * @returns A promise that resolves with the newly created MapViewer
   */
  async replaceMap<T>(test: Test<T>, mapId: string, mapConfig: unknown): Promise<MapViewer> {
    // Delete current map
    test.addStep('Deleting current map...');
    await this.getApi().deleteMapViewer(mapId, false);

    // Wait for layer to load and data table to initialize
    test.addStep('Creating the map from config...');
    const mapViewer = await this.getApi().createMapFromConfigFast(mapId, JSON.stringify(mapConfig), 500);

    // Replace the map viewer and the controller registry in the tester with the new one created from config
    this.reassignMapViewerAndControllers(mapViewer, mapViewer.controllers);

    // Waiting for layers to get loaded even when map is in a background tab
    test.addStep('Waiting for layers to get loaded even when map is in a background tab...');
    const loadedLayersCount = await this.getControllersRegistry().layerController.waitForLayersLoadedForcingRenders();
    test.addStep(`Layers loaded (${loadedLayersCount})`);

    // Force a final synchronous render so OL populates frameState_ (required for getPixelFromCoordinate to work in hidden tabs)
    test.addStep('Waiting for map render...');
    await mapViewer.waitForRender();

    // Return the map viewer
    return mapViewer;
  }

  /**
   * Removes a layer from the map using its path and asserts that it no longer exists in the legend store.
   *
   * Each step is logged to the provided test instance for traceability.
   *
   * @param test - The test instance used to record each step of the removal process
   * @param mapViewer - The map viewer instance from which the layer is removed
   * @param layerPath - The unique path or ID of the layer to be removed
   */
  helperFinalizeStepRemoveLayerAndAssert<T>(test: Test<T>, layerPath: string): void {
    // Check that the layer is indeed there
    test.addStep(`Checking the layer path ${layerPath} exists on the map...`);
    Test.assertArrayIncludes(this.getControllersRegistry().layerController.getGeoviewLayerPaths(), layerPath);

    // Remove the added layer
    test.addStep(`Removing the layer ${layerPath} from the map...`);
    this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(layerPath);

    // Check the removal worked
    test.addStep(`Check that the layer is indeed removed...`);
    const legendLayer = getStoreLayerLegendLayerByPath(this.getMapId(), layerPath);
    Test.assertIsUndefined('legendLayer', legendLayer);
  }
}
