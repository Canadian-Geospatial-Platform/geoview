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
      name: 'Quebec',
      isVisible: true,
    },
    {
      geometryType: 'Polygon',
      name: 'Alberta',
      isVisible: false,
    },
    {
      geometryType: 'Polygon',
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
