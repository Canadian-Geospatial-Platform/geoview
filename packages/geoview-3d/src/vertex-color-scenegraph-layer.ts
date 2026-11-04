import { ScenegraphLayer } from '@deck.gl/mesh-layers';

/** Shader description returned by deck.gl layers (typed `any` upstream); only the injection map is read here. */
type TypeLayerShaders = { inject?: Record<string, string> } & Record<string, unknown>;

/**
 * ScenegraphLayer that honours glTF vertex colours (COLOR_0).
 *
 * deck.gl 9.4's scenegraph shader ignores COLOR_0 and colours geometry with the material and a per-instance colour
 * only. Tilesets that carry their colour per vertex over a white material (e.g. tyler output) then render gray. The
 * glTF spec multiplies COLOR_0 into the base colour, which this layer restores. luma.gl uploads COLOR_0 as the
 * `colors` attribute and defines HAS_COLORS only when it exists, so other glTFs render unchanged.
 */
export class VertexColorScenegraphLayer extends ScenegraphLayer {
  static override layerName = 'VertexColorScenegraphLayer';

  /**
   * Adds the COLOR_0 multiplication to the scenegraph shaders.
   *
   * @returns The shaders with the vertex-colour injection
   */
  override getShaders(): TypeLayerShaders {
    const shaders = super.getShaders() as TypeLayerShaders;
    return {
      ...shaders,
      inject: {
        ...shaders.inject,
        'vs:#decl': `${shaders.inject?.['vs:#decl'] ?? ''}
#ifdef HAS_COLORS
in vec4 colors;
#endif
`,
        'vs:DECKGL_FILTER_COLOR': `${shaders.inject?.['vs:DECKGL_FILTER_COLOR'] ?? ''}
#ifdef HAS_COLORS
color *= colors;
#endif
`,
      },
    };
  }
}
