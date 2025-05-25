var poi = 
    ee.Geometry.Polygon(
        [[[77.67456719486366, 13.028734308323427],
          [77.67456719486366, 13.011842258079875],
          [77.69585320560584, 13.011842258079875],
          [77.69585320560584, 13.028734308323427]]], null, false);
var buildingCollection = ee.ImageCollection('GOOGLE/Research/open-buildings-temporal/v1');
var heightPalette = ['#000000', '#ffcccc', '#ff9999', '#ff6666', '#ff3333', '#cc0000']; 
var heightRanges = [0, 1, 2, 4, 7, 9, 10];
function displayBuildingLayers(timestamp) {
  var buildingImage = buildingCollection
    .filter(ee.Filter.eq('system:time_start', timestamp))
    .mosaic();
  var year = ee.Date(timestamp).get('year').getInfo();

  Map.addLayer(buildingImage.select('building_presence'), {max: 1}, 
               'Building Presence ' + year);
  var buildingPresence = buildingImage.select('building_presence');
  var buildingHeight = buildingImage.select('building_height');
  var maskedHeight = buildingHeight.updateMask(buildingPresence);
  Map.addLayer(
    maskedHeight, 
    {
      min: 0,
      max: 10,
      palette: heightPalette
    }, 
    'Building Height ' + year
  );
}
var timestamps = buildingCollection
  .filterBounds(poi)
  .aggregate_array('system:time_start')
  .distinct()
  .sort()
  .getInfo()
  .slice(-5);
timestamps.forEach(displayBuildingLayers);

Map.centerObject(poi, 14);
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
    backgroundColor: 'white'
  }
});
var legendTitle = ui.Label({
  value: 'Building Height (meters)',
  style: {
    fontWeight: 'bold',
    fontSize: '16px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);
var legendLabels = ['1-2', '2-4', '5-7', '7-9', '10+'];
for (var i = 1; i < heightPalette.length; i++) {  // Start from 1 to skip the black color for 0
  var colorBox = ui.Label({
    style: {
      backgroundColor: heightPalette[i],
      padding: '8px',
      margin: '0 0 4px 0'
    }
  });
  
  var description = ui.Label({
    value: legendLabels[i-1],
    style: {margin: '0 0 4px 6px'}
  });
  
  var horizontalPanel = ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
  
  legend.add(horizontalPanel);
}

Map.add(legend);
var latestYear = ee.Date(timestamps[timestamps.length - 1]).get('year').getInfo();
var latestImage = buildingCollection
  .filter(ee.Filter.eq('system:time_start', timestamps[timestamps.length - 1]))
  .mosaic();

var latestPresence = latestImage.select('building_presence');
var latestHeight = latestImage.select('building_height');

var maskedLatestHeight = latestHeight.updateMask(latestPresence);

Export.image.toDrive({
  image: maskedLatestHeight.clip(poi),
  description: 'Building_Height_' + latestYear,
  folder: 'GEE_Exports',
  fileNamePrefix: 'building_height_' + latestYear,
  region: poi,
  scale: 4,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
var latestPresenceImage = latestImage.select('building_presence');

Export.image.toDrive({
  image: latestPresenceImage.clip(poi),
  description: 'building_presence_' + latestYear,
  folder: 'GEE_Exports',
  fileNamePrefix: 'building_presence_' + latestYear,
  region: poi,
  scale: 4,
  crs: 'EPSG:4326',
  maxPixels: 1e13
});
