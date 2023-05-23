import lineSplit from "@turf/line-split";
import combine from "@turf/combine";
import flatten from "@turf/flatten";
import { featureCollection } from "@turf/helpers";

const LINE_STRING = 'LineString'
const MULTI_LINE_STRING = 'MultiLineString'
const UPDATE = 'draw.update'

const SplitLineMode = {
  onSetup: function ({ spliter }) {
    let main = this.getSelected().map((f) => f.toGeoJSON());
    if (main.length < 1)
      throw new Error("Please select a Linestring/MultiLinestring!");
    const state = {
      main,
      spliter: `passing_mode_${spliter}`,
    };
    return state;
  },

  toDisplayFeatures: function (state, geojson, display) {
    display(geojson);
    this.changeMode(state.spliter, (cut) => {
      state.main.forEach((mainFeature, idx) => {
        const splitedFeatures = [];
        flatten(mainFeature).features.forEach((feature) => {
          if (
            feature.geometry.type === LINE_STRING ||
            feature.geometry.type === MULTI_LINE_STRING
          ) {
            const afterCut = lineSplit(feature, cut);
            if (afterCut.features.length < 1)
              splitedFeatures.push(featureCollection([feature]));
            else splitedFeatures.push(afterCut);
          } else {
            throw new Error("The feature is not Linestring/MultiLinestring!");
          }
        });

        const collected = featureCollection(
          splitedFeatures.flatMap((featureColl) => featureColl.features)
        );
        const afterCutMultiLineString = combine(collected).features[0];
        afterCutMultiLineString.id = mainFeature.id;
        this._ctx.api.add(afterCutMultiLineString);
        this.fireUpdate(afterCutMultiLineString, mainFeature)
      });
    });
  },
  fireUpdate: function(newFeatures, mainFeature) {
    this.map.fire(UPDATE, {
        action: 'SplitLine',
        features: newFeatures,
        mainFeature: mainFeature
    });
  }
};

export default SplitLineMode;
