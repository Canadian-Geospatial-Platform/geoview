import type { Coordinate } from 'ol/coordinate';

import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { TypeLegendItem } from 'geoview-core/core/components/layers/types';
import type { LayerApi } from 'geoview-core/geo/layer/layer';
import { AbstractTester } from '../core/abstract-tester';

/**
 * Main GeoView Abstract Tester class.
 * @extends {AbstractTester}
 */
export abstract class GVAbstractTester extends AbstractTester {
  /** GLOBAL CONSTANTS FOR THE TESTS */

  /** Some long lat coordinates for map investigations */
  static readonly QUEBEC_LONLAT: Coordinate = [-71.356054449131, 46.78077550041052];
  static readonly MANITOBA_CENTER_LONLAT: Coordinate = [-86.73558298224057, 50.833271435899974];

  /** Bad url */
  static BAD_URL = 'https://badurl/oops';

  /**
   * Fake url acting like a WMS/WFS url for a GetCapabilities call - the proxy is a good url to use to fake this.
   * Something like https://google.ca will get turned into https://google.ca/?service=WFS&request=GetCapabilities and that's
   * not a 200 response and we can't test with that.
   * Not using the core config url constant on purpose, because it serves a whole different purpose here.
   */
  static FAKE_URL_ALWAYS_RETURNING_RESPONSE_INSTEAD_OF_NETWORK_ERROR = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

  /** Airborne Radioactivity uuid */
  static AIRBORNE_RADIOACTIVITY_UUID: string = '21b821cf-0f1c-40ee-8925-eab12d357668';
  static AIRBORNE_RADIOACTIVITY_GROUP: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0';
  static AIRBORNE_RADIOACTIVITY_UUID_WITH_SUFFIX: string = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID + '/0/1';
  static AIRBORNE_RADIOACTIVITY_LAYER_GROUP_NAME: string = 'Airborne Radioactivity';

  /** Historical Flood */
  static readonly HISTORICAL_FLOOD_URL_MAP_SERVER: string =
    'https://maps-cartes.services.geo.ca/server_serveur/rest/services/NRCan/historical_flood_event_en/MapServer';
  static readonly HISTORICAL_FLOOD_URL_LAYER_ID: string = '0';
  static readonly HISTORICAL_FLOOD_LAYER_NAME: string = 'Historical Flood Events';

  static readonly HISTORICAL_FLOOD_URL_FEATURE_SERVER: string =
    GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER + '/' + GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID;

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
  static readonly FOREST_INDUSTRY_FEATURE_SERVER: string =
    GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER + '/' + GVAbstractTester.FOREST_INDUSTRY_LAYER_ID;

  static readonly FOREST_INDUSTRY_ICON_LIST: TypeLegendItem[] = [
    {
      geometryType: 'Point',
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAgUlEQVR4AZyOwQ1AQBBFRQcUJCEuDm4U46AADehB4iiO1CCOehAFOHg7sZvhJDb/7cz++dld3/u4fgdTHhhvEqqTvtGEOibZTU+NQaSDFU4IVgFNCyIdPMV5bps96mCDuYPVQVODSAcnnAIGMP+LqAuIdNAYM1sOJazg9A66wbu5AAAA//+f041kAAAABklEQVQDAMXcEBVUfU+0AAAAAElFTkSuQmCC',
      name: 'Mills',
      isVisible: true,
    },
  ];

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
  static readonly FEATURE_SERVER_TORONTO_NEIGHBOURHOODS_LAYER_NAME: string = 'Toronto_Neighbourhoods';

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
  static readonly DATACUBE_MSI_LAYERS_MSI_GET_CAP: string =
    GVAbstractTester.DATACUBE_MSI + '?request=GetCapabilities&amp;service=wms&amp;version=1.3.0&amp;layers=msi';
  static readonly DATACUBE_MSI_ICON_IMAGE: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAAXCAYAAACiRWVyAAAQAElEQVR4AeyZB5CWRQ/H8z/wUFAEYXTsomNvYG/oITZE9AAF7GDFz3Y27L137F2xgkqVrogi0mzgKNil2LCMgNLh7r788ty+vKif1Lnxc+4dcrubTbLZbDbJPhSUV/2qLPAvskCB+c/343/NaFcGIAw5tFVQZYHKtEA4tKRYU5JJKw4Ik0RTBVUWqFQLhEOnaFpWXm4L58y28tkzrWwZAZ4FzosMdpBk0q+CKgtUlgXCodNiC+fMsvv7D7VOA0balQNG2BVLCdB2ctpHBg61snlzk7iqtsoClW6BxRy6WlmZTSpfxYZXq2ejq9VxqLtUMMZp4ZlSVmjVy0srfROVtWDKOmVuJ4B1E47+yoAkj7a0tDTeNchlTLv88M/gTPvAfgBaJRz9FYXFHNq87K2hclvdFlqt8jKraaVLCWVOX2qFzluOkCVolTbAhhYsWGDAwoUL//GHJ7mBfG8FBQUGeHexf+yBPYFMe6S/LCApZ4dq1aoFK7KkDI+tcPSY8D+sx7rezfHRB+BLLXz5Y/ArCvny6APITC39P4L0ZxtKGe6PtMszXtyhy82NIitzpyxzaeXeLg1AWxa0zrSEf2xWkq/jkr1dZZVVrHr16gFStjEpa5cgqtKn0Z1Ff/31V/vpp5/oLgbsIzm6tHx7YA1J9uOPP1qnTp1s1qxZJmX2YjHsxRrQMZYUtkt92gRSpoMkg09aNE40K9JKi+RJCj2RJ4nmLyHp/csvvxgAETiA/orC4g69otKWgl+SEVUk2WeffWYXXnihnXrqqXbPPffY/PnzQwIRBxqiSn40YtOMwUPDGAZw0NOn/V9ziZ4WHuTQMk688INjjj54gP68efPo2oMPPmgXX3xx9FkrOv7nkksusffee897ZshgLl8O64AHR8sY4vwWPLhXXnnFPvzwQ1t9dc+Xnr0k2fTp0+2MM86w1157Lec8H3zwgT300EOwxJrIYl0gyeJynH322TbN+SFkDh1Sy97A0yY8csDRJmAMDXwAeHCc22+//RaZlnlwaY4WPZLcZMN7773Xbr/9dkhD70ST+JmAl3XgzcfTB8ccNImWttIdGgWIML///rsdc8wxETkOPuQQdLG0WVItNEQV+vAkAE8kBBIOGimLCswzRiDzjAH6UkYjyaBBPnNW8ZMUpQQ45iRFJkm8rGn+Y96bP/1bb731rFatWjk89IC0SA68yGZ9CJNsWsYJP2DAAOvozgsuzX399df28MMPW8eOHW3GjBlM2dixY61nz57R56ChZU1AyvaLzI022siqFWTHzTjpAB06wStlkRwccgApkyEpF4iYB+BhYfQ67rjj6Ib9Eh8tSNaDPgG4tCZ9SQYNOknK2Rz+xAM9Y9akDy084AAp48t2aJX3QyFW+/jjjw2nvuiii+yoI480Isgaa6wRUWTcuHH25ZdfRuSBTqpQ1g/k/ffft0ceecQGDRqUM/Bbb72VKwF++OEHGz58OEtEFBs9erRNnDgx+mltbvfQoUND/pgxY2IOBjIGhzNs2DB78sknIyJKinkcqEuXLvbOO+/EWBIsARiUTrNmzWydddahG7r17tPHnnjiCUOmpOBDt/vvv9/y14VfyvYoyb744ovgKSoqClmSosVerVq1sgYNGthtt90WOA62Ro0a0eeAoXnxpZfsscceM2zBRJ06deyggw6yRPfJJ5/Yo48+al27drVnn33Wvvvuu3BE1uXC9PHsQNSVFumE7XCkSZMmBe/L3bsbERL8iy++aJwTMsePHx/7BM/akuzdd98Nnq5du9kLL7wAOhw40WDbXr17B81XX30V/JIicnOxkfvpp58GHh1Yg6zE3B9tV+kOjULsaLfddrN1113X9t1338UOd6o75IEHHmgXXHBBRJ8mTZqEQeC788477fjjj7fJkyfbVVddZSeeeCKi4vA4QAbdunWLw5s5cyZDO//88+3zzz+PPgdAB2cl5X377bfWtm1b696jB2jr1auX7bzzzsYBPf/883b44YcHfu7cuda8eXPr4w763HPP2U033ZRzDgwaRP7n3HPPtSGvv+49szZt2tijfvFw3BtvvDFwtHfffbeRnktKSqyHR1ZJ4fzISQfM+nvssYfVdUdEZylzaGgYYwccb/bs2VZYWCNXquEYJ510ko14++1wMGxFuQEf+lOyfPTRR1ZcXGw4BeXezTffbDU9q7zxxht28sknGzSPubNfffXVxg9eygHsT+Bo37591L7Pux3gl2TffPNNBCdkp7oYHknGpT7hhBNswoQJXlqeYk899RRiDblStq9rrrnG+volonw69NBDDaeGiPKKi4tc9IEHxz/zzDPDhp07dzZsCi22Y77SHVpSbIZo0q9f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';

  static readonly DATACUBE_RING_FIRE: string = 'https://datacube.services.geo.ca/web/aerial.xml';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_HALIFAX: string = 'halifax';
  static readonly DATACUBE_RING_FIRE_HALIFAX_ICON_IMAGE: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAV4AAABICAYAAAC+050oAAAOlUlEQVR4AeydCawd0x/Hf7+GaEgpQgghtCGEiLVNLalIixBiKSpEY0lLQyqkao99iYYQW4Q8IWgJIXaxpA2xLyEEVUsIIfYQQvr+7zPzzr9nTufed/vezH33Xt/mnfs7y2/OmfuZM7+eOzP3e8f0658IiIAIiEBbCYwx/RMBERABEWgrAQXetuLWYCIgAh1LoI07psDbRtgaSgREQAQgoMALBSUREAERaCMBBd42wtZQIiACq0ugN/0VeHvzuOpdiYAIdDABBd4OPjjaNREQgd4koMDbm8dV70oE6iSgvkdIQIF3hAC1uQiIgAisLgEF3tUlJn8REAERGCEBBd4RAtTmItApBLQf3UNAgbd7jpX2VAREoEcIKPD2yIHU2xABEegeAgq83XOstKfdSED7LAIlBBR4S6CoSgREQATqJKDAWyfdgb6feOIJO+qoo5TEoCPnAPNzYJrqr80EFHhrBn733Xfbgw8+qNRRDHQ8wpxkftZ8Cqj7EgIKvCVQ6qhydxszZoytscYatuaaa9paa61lY8eOtbXXXtvWWWcdGzdunK277ro2fvx422CDDWzDDTe0jTbayDbeeGPbZJNNbNNNN7XNNtvMNt98c9tiiy1syy23tK222somTJhgEydOtG222ca23XZb22677Wz77be3HXbYwXbccUfbaaedbOedd7ZddtnFdtttN9t9991t0qRJNnnyZJsyZYrtueeetvfee9s+++xjU6dOtX333df2228/mzZtmk2fPt0OOOAAO/DAA+2ggw6ygw8+2A455BA79NBD7bDDDrPDDz/cjjzyyGwld/TRR9vMmTPt2GOPteOOO86OP/54O+GEE2zWrFl24okn2kknnWSnnHKKzZ492+bMmWOnnXaazZ07104//XQ744wzbN68eXbmmWfaWWedZWeffbbNnz/fFixYYOeee66df/75dsEFF9hFF11kF198sV1yySV26aWX2uWXX25XXHGFXXXVVXb11Vfbtddea9ddd50tXLjQrr/+ervhhhvsxhtvtJtuusluvvlmu+WWW+y2226z22+/3e644w6788477a677rK+vj4jAN1zzz1277332n333Wf333+/LVq0KPsP86GHHrKHH37YHnnkEXv00Uftscces8cff9xY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';
  static readonly DATACUBE_RING_FIRE_LAYER_ID_VICTORIA: string = 'victoria';

  /** Geomet */
  static readonly GEOMET_URL: string = 'https://geo.weather.gc.ca/geomet';
  static readonly GEOMET_URL_CURRENT_COND_LAYER_ID: string = 'ec-msc:CURRENT_CONDITIONS';

  // GV: Can't add the icon property here, because it's a randomly generated color depending on the layers processed on the map
  static readonly GEOMET_ICON_LIST: Partial<TypeLegendItem>[] = [
    {
      geometryType: 'Point',
      name: 'Current Conditions',
      isVisible: true,
    },
  ];

  /** Geojson */
  static readonly GEOJSON_METADATA_META: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/geojson/metadata.meta';
  static readonly GEOJSON_METADATA_META_FILE: string = 'metadata.meta';
  static readonly GEOJSON_POLYGONS: string = 'polygons.json';
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
      icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAQAElEQVR4AcxZa5CU1Zl++jI9PbeensFwZ2QRJBJZBIlZFG8ICwqoIKUSKmpMrany39amtnZLf2DFSqWszVZtba5VBI2igDELmiGGEFCU1WgUEMULLuJgYJgZZ+abvsz0dH+XfZ7zzdfzzdCMJMVWdoqXc3vPOe9z3vNevtPRTz75xGtra/NOnjzpnTp1yjt9+rTX0dHhdXZ2et3d3V5PT49nWZaXyWS8fD7v9ff3e4VCwSsWi55t257jON7/h78ohYDrugiXFM60VWosoNFt9Qfz8Ff+i0qYMElYCReUGlM7XKoeUJjvr4llBJCud96BqPPwYbz9gx/gzcceQ9eRIzhz8CD+8P3v47XvfQ8dHGt/+20cePRRvPrd7+LMoUM4/dZb2P/II3h540bT1vj+Rx4xfRr/v2hrz/DBjQDy2d69ePbRA9iypRYHD8ZRLAI6cZ2+tCLKZh0891wMr7wSNbR9O5DLOeYqalz8KgcHPbzxhoef/tTDz37m19WnsTDlch62bfPw0ks+bd3qcT2vvF7Aq7nl9f6pFcdaW8M4MAKIJmnUHn8Fqpf/M+Y8+I8Yd/nlGDd3LhZ+5zuGmub8LTB5PuzFD5MeQs2MKzg+H9c89BAWP/wwJs6fj4kLFuDv/mUjkis2ApMWkH8hmtZsxKJ/3cjmAkxeuBA3bNxoaPy8BYhNWwg2DNXPWsD5w+OTuJb4R6yHs/8MEAHQqU9ZsgSJucuQTjtob4/i2Wdrkcm45nR00tks8MwzCfT2RgxPU5OH06eBp56KGT6tIb5MxsPjj7vo6QHGjfPp1CngiSfA0x4WIpMBnngCfzZf+mu3Yvattw4vxJrxWtrcCGHbuPGGDNau7UMq5XCDCNVeRyE9CMSWLdUGhMbWry9A1NjogV6aAsVgWa7h/fnPJVyEYD1885sw1NQE8gEaEwDR5s3iAzT25/CtXsXDpael/OV/UYEINHLqpZfQ/fpeJJM21q2z0NjoUDhg69ZaaiKJvr4IN7Xx9a8PoKbGQW2tiw0bBsjnEaCHJ5+MURNRM6e52cX997uGp74e+Na3fIF7ewEBEFkWcNFF/ph4ROfD96d9FWxEIAIwqouknWTSwR13SDOuAdDXFyUIB3fd1W+Aik/zamoEplAGY1mAQNx7r02wPDnPM3EqLKRlAZYFA+L++wGNBUeregDGsgDLqswX8AdlWSMSauL110MkIQVGpef5wngUSFQq+R5K/GoHfH4J2pPPXyq5BkCYL9g0XI66IeGhEfUwn+xDFGYwNuIL4cGhjXicoc1zOWD79nqeSBQNDY6h7m7fZrJZjwKT33GM8T75ZBX5IoYnlfLw+eeesZnMkKPQ+pqzaZOuIJBOA+k0yOfbjPYKhFJddqQrmE4D6fTZfJJRFMxRaTSijST8mVdeQdue/cjnI4wVjTTcGIWzafzW0DUbthkJls+DMSdhQMgBbNgwaOxHYHp7PfziFzGu4dJRuMbIe2kf6bRsB7QfIJ0GbWsYTBiEHICunSidHsn33n+1nh1HwtdD9Q8/rMGvfpWmADF6rhLWrOmlwdqG5M0aG10j+LZttXj66RrWoxTIpgcbMDx1dS7BFNjn0uv5YDZvjhqBm5pc3HefR5twubYPprnZF1LGH2hCLlsAUilU5GOiISWMIBNHpBHR+GuvhTVh+RCIIm67rYcGa5trpPG6OsdoR3Gml7HEsiJobLRx5539I/jq610CK9A5eAZMLzXR1OTgG9+wCda3Ma0nQeV2JbhijvhUv+8+8CYMyzmab6ClQhzRgmXinYcxbhdVVS5s299U1048Kpm1GyOW9kTV1bIVF6prPCjF5zjq9x1AIuHBb3vl+VqTPoRzh4VOJofr4doIPslIWw6Pj9BIx6uvorFjN9Vpo7MzjhdeaOb99riRZzbP5SK8dg28JlFIEzrl9vbIOTMAixqT9nSllAFs2RKjtl2zlkBk/sIMoPZPFWxECwak05w1K4+VKzt4j23e/xh27Gjm5h69UwS//GWKfVGqXQ6gj/bjx5meHt+bSTBF7CADkLdT9F+/fpDAPXopz3gzZQB9fb4D0Nx02jPRX9dMRt7d7TsArSWS/fQw3dGYeJjOhZVh6kYjAiAw466+mnFkEaqrbaxeLTAlBsModu4cR02kqZ0Y0ukSPZhlgqKiuzIAeSydvjKArVu/OAOQN3v88SgPRcHToQdzaTsuDw/nlQHMXXfr2LmWSxsxxPsXgGlosKmRiAGRShVx++29BFoy10M2oQxg3TppxiHoCClKIx87A7AsD5YlEC7uuceho3DL1/d8IrtiiMioYug/E0cCjXS//jo+f+01I6Q05Lq+bcjQXILTnCCyqx3M8+uuhimQL5Rt+6XABnzDpe8A+D8dilveLxg3C436b2h706tvEZFpDP1nInulzfIMii+88CVqIo66upKxi97emLEZBUNtqnm5HGjsDTzhKK+GTT6XWW7EJJqj+UZnAF1dvs1kmAHoMESacz4ZwJD85aKsEQnVvGgRaudfjf7+KH796/G8UjEKV8SqVR10AJ2sBzbTTIAeBPa55xoNn66gkkxRA1Maix5LNiMh8xUzgAK9o0cPOAwmm5UDUB+QHiMDmLb0HDaikzAnzFzrvw+MQ2vrBAoa5+kWcfPNZ2jYJd7jkgGTStnGDnbubDYOIJOJUaASPViv4amttekM+uilHGopwnytLpQBOAyUAzRsm1p2yhlAkM74GUCENjZ2BrBzh4uKNiIg0kjvG28Ax/YPgRjEihXtBoTGRTU1JdxyyxkK7oPxQRTPygAERumM4oyitbSjuHPnnXmCtaFD03rDGYB7VgagVCfgGx3ZM2+1fnGuJcP2GDmrhiK7NhxJoHF6FAYkr2IGIH5FcccZ5hs7Awj4XAQZgNYQeRTIL7Vf2STOqpg4IkZpJPXVr8KddS2vVAldXVXYvXsS8jT6YLEcI3tr60W8WrpORWqmhI6O+DkzAMuK8orZvO/OBX0DqPjNLhAiIyzjyNeuasdNN53kHS5R4DhefHEyr1qEkT1K2xlPw44bo7/llk7aTAdB27SFqPFmGaYcAhtkAPX1JSaZfYZSF/ANoOI3u0AE1PfHP6L/8Osm4C1b1kaBixQ8SjCTsGvXBIKJUwuDtJN2w6OguWrVGfLZBH3uDCBZ8Q2ghmvLsG0a/VhvABEeFMznc/AGUPGbPQChUloRqS4hly49aTSTzUYNiPr6QeMAqqtLtBPXUDLpmHSmwWQAUWrPv3bhDEDriU+uOZVyCTpiKM1npy9+A4gYEOE3AMk42kiMjWhAm9VfeSUa+HimumxG/R4NX5OCMojY4vGGDNFlBqC6yB0KwZUyAI17XM/jvIACvmA/zdeYX8rAXeNUwm8As1atgkhyBVSO7Jpo8izaieoDAzEa+1SecBX9fpGasWFZMV6zydQOjDa0uZyBMoBMJkaekrlmvb2+zWRHfdtfsDcAySgaOjTwrxzZJXyWj9M9fzhoIvuePdMocJwgBo3x33RTGwW1ea9lM5ONNxsYqJQBdBgwmYxspnIGsHatZYKmHIBl+e9mGaYp+YoZwADtUtHeK78BHN3Rio937TKaktzEgbJGpE7RiRNp/P73FxtN1NUJRBuDYpGBrATZjDyRhPztbycxjZlAvjg9V7GcASgYrlzZyT6bdhBDpQxAPKK1fNEM3gC2b68LZQB2KANw6QwKSDNl4W9OBsyhQ5EyCMksMGWN6JrU8oulq3kJTzvBUy3gxhs/pXcqlq9RMlk02mloKBkhczmB8B1AMlkyfFq0hhmAPs5SqRKvY5Ra9B3AhXoDyE9djRk332z2k9wCYzSizdVwmGsRq2GIxx2m2I6pB+MqXRq2iPbKMa8c2V3e1zApqrvkBf88GnjVUKbgcaI2d8mv0ufzDVpjY2cA4gM814axZ66hOS5LoxFVtGj/4cMY172X2hhkKp7E/v3Tjb1oXJTPR7FnzxSecNzwNDQUvzADaGgY5B23MVYGIOegXEy5WfAGEHYUmQz49pygdiO8Yg7qTu3C8RdfRABCso3QiAZaWnpwzTXHaNhFXp8q7N07Hfl8zNCePS20iSoztnTpZ+aa6Vulry9mvFk2G0EuFx2RAaxc2RXKAPzvmcyoDEAxSPayZk0fQSuBjJjvGfEJxNNPVzPdj9DuHNpOAXPnOgaEDl8gRCaOqKLO5Lx5qFtwOe2ihMWLPzIC53JV/DVpOgG1EEycixUI4FNeqUHD52cAJWopSjAjM4CVK88YHgXXv+QNQI+Ald4ALl29HNOXLzdgJLuoDETa0L1Tnq8BRe8ATDYb50lLEwXccMMJZqjF8iIScuk5MoBEokg7cg2JT2B0+plMhJr1HUA4AzCHyUwheAOwrAhvRYU3ANqyZBW/ZBWVgagx8M47zLUOm43FRLNi3YH+BFRlYJziF4lPYx4NWuNBaQ99s4tnmDyu5/IQuPIQfxDZxePREah0XZc8rpYzpfoDPu336e9+hxO7d3PMX09zRgDRBM3WQKEQx8svz+R1qmYcKTAwFnk6vs3oU1g8ooHzyADEl+fngDIAaVd2VV9v8977NhM27FwOFd8Atm2roxa9svCSVaC0tsgAUacaVfzhE7OvgITbv18gEgyEA7juuo9pM8cMGNnMvn1/A4ER3/lkAOK9kG8AE677e7QsWzYClPFaZWTMXw4fasGBA7MpaDUFHzAeLJEYpFaKBoyivU51377pdMWBFxukA2gzPDUMhrIZPwOIGQdwod8AfrMrYeKI5JYSVJo4ooY0Ujp6FMmTb/I6JQyIRYs+pHcqmHst5iQj++LFx0wMyWarDF99fcE4gOpq37ADPn2cKc5kmExm6SwUT8Z6A7D4NSneFB8BR2cAQTqjOKM3gMKR3fwdZ4/RiPaT/GWNqCEwspFa631M+GAT+n/zPIptbRg8cQJ9zz+P3h072Kbr7TrK8Z/gS0d/hBryDhz/GB3bt+PMtm3oP34cuWPH0PnsFtS++SMkut9H4vMjqH/rP/HZU5uR+egj9H3wAY7zx5D/2bQJ2WMfIdJ+BA1v/zt5/g2J7iPoee9dvP/jH+O9H/4QPUePovvdd/HBT/4D7r7HEO04QgBAf0eHOWDJLTBljagR/8pX+KaawqJF72Lq1E7EYkwFGP4FUKRJ8fggrrrqBGbPbsdll3XgyivbqLXhPEt8Is299NIeLF9+gh9jJzFzZh/iTHs0pnUCSiRKWLKkEwsW9JEyuP76Hl5RZ4SQmqO58+YN4O67LTzwzD9g1vr1hkdyay2jETGq4U2ciOiUKYiQqhlwkitWIDZ1KmLTpqGeHzOiqpYWVF18MdK3347G225D9fTpSJDG3XEHLlq3zrSTM2Zgwl13YeLdd6P2kktQO3MmpmzYYKiOdbVb7rkHF997L+pnzULD7NmYwZ+oLuHPuSnWU1/+MmZ/+9u49IEHkL7sMjSS5jz4IERqS96mOXMMEMmtttGIKgGyoFRfwKR6wCAPRwAAAFtJREFUQBpXXaXGg1J9aqsMk8bVVqnxoFSf2irDpPGgrXG1VaovKFUXqa1x1UdoRB3BYFCqL0zqVztcajG1VWosTOpXO1yKT22VGguT+ke3xad+leExtdWvvv8FAAD//28D6RwAAAAGSURBVAMAvlzJRqvuDbEAAAAASUVORK5CYII=',
      name: 'Other provinces',
      isVisible: true,
    },
  ];

  static readonly CSV_STATION_LIST: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/csv-files/Station_List_Minus_HQ-MELCC.csv';
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
      name: 'lakes of the world, public domain',
      isVisible: true,
    },
  ];

  static readonly WKB_SOUTH_AFRICA: string =
    '0103000000010000000500000054E3A59BC4602540643BDF4F8D1739C05C8FC2F5284C4140EC51B81E852B34C0D578E926316843406F1283C0CAD141C01B2FDD2406012B40A4703D0AD79343C054E3A59BC4602540643BDF4F8D1739C0';

  static readonly KML_TORNADO: string =
    'https://canadian-geospatial-platform.github.io/geoview/public/datasets/kml-files/CanadianNationalTornadoDatabase_1980-2009.kml';
  static readonly KML_TORNADO_FILE: string = 'CanadianNationalTornadoDatabase_1980-2009.kml';

  static readonly GEOTIFF_VEGETATION: string =
    'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/eo4ce/vegetation/vegetation-2020-fCOVER.tif';
  static readonly GEOTIFF_VEGETATION_FILE: string = 'vegetation-2020-fCOVER.tif';

  static readonly INITIAL_SETTINGS_CONFIG = {
    geoviewLayerId: 'geojsonLYR1',
    geoviewLayerName: 'GeoJSON Sample',
    metadataAccessPath: './datasets/geojson/metadata.meta',
    geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
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

  /**
   * Constructs a GeoView specific tester.
   * @param {API} api - The api.
   * @param {string} mapViewer - The map viewer.
   */
  constructor(api: API, mapViewer: MapViewer) {
    super();

    // Keep the attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
  }

  /**
   * Gets the shared api.
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer.
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the LayerApi.
   */
  getLayerApi(): LayerApi {
    return this.getMapViewer().layer;
  }

  /**
   * Gets the Map Id.
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }
}
