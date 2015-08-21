/**
 * @apiDefine landsatSuccess
 * @apiSuccess {object}   meta            Response's Meta data
 * @apiSuccess {string}   meta.name       Name of the API
 * @apiSuccess {string}   meta.license    Provider's license
 * @apiSuccess {string}   meta.website    Provider's website
 * @apiSuccess {number}   meta.page       The page number of the returned result
 * @apiSuccess {number}   meta.limit      The set limit for the response. The
 * response lenght correponds to the limit. For example,
 * if limit is set to 5 only 5 or fewer results are returned
 * @apiSuccess {number}   meta.found      Shows how many records is found for
 * particular query.
 * @apiSuccess {object[]} results                             List of returned results
 * @apiSuccess {string}   results.sceneID                     Unique Landsat-8 image name
 * @apiSuccess {string}   results.sensor                      Indicates which sensor collected data for this image
 * @apiSuccess {string}   results.acquisitionDate             The date the image was taken
 * @apiSuccess {string}   results.dateUpdated                 The date the image was added
 * @apiSuccess {string}   results.browseAvailable             Whether thumnail is available
 * @apiSuccess {string}   results.browseURL                   The url to the NASA generated thumbnail
 * @apiSuccess {number}   results.path                        The image's path
 * @apiSuccess {number}   results.row                         The image's row
 * @apiSuccess {number}   results.upperLeftCornerLatitude     The upper left corner's latitude
 * @apiSuccess {number}   results.upperLeftCornerLongitude    The upper left corner's longitude
 * @apiSuccess {number}   results.upperRightCornerLatitude    The upper right corner's latitude
 * @apiSuccess {number}   results.upperRightCornerLongitude   The upper right corner's longitude
 * @apiSuccess {number}   results.lowerLeftCornerLatitude     The left left corner's latitude
 * @apiSuccess {number}   results.lowerLeftCornerLongitude    The left left corner's longitude
 * @apiSuccess {number}   results.lowerRightCornerLatitude    The upper right corner's latitude
 * @apiSuccess {number}   results.lowerRightCornerLongitude   The upper right corner's longitude
 * @apiSuccess {number}   results.sceneCenterLatitude         The center of the scenes' latitude
 * @apiSuccess {number}   results.sceneCenterLongitude        The center of the scenes' longitude
 * @apiSuccess {number}   results.cloudCover                  The overall cloud coverage (percent) of
 * the WRS-2 scene in integer. -1 indicates that the score was not calculated
 * @apiSuccess {number}   results.cloudCoverFull              The overall cloud coverage (percent) of
 * the WRS-2 scene. -1 indicates that the score was not calculated
 * @apiSuccess {string}   results.dayOrNight                  Whether the scene is from day or night
 * @apiSuccess {number}   results.sunElevation                The Sun elevation angle in degrees for the
 * image center location at the image center acquisition time. A positive value indicates a daytime
 * scene. A negative value (-) indicates a nighttime scene.
 * @apiSuccess {number}   results.sunAzimuth                  The Sun azimuth angle in degrees for the
 * image center location at the image center acquisition time. A positive value indicates angles to the
 * east or clockwise from the north. A negative value (-) indicates angles to the west or counter
 * clockwise from the north
 * @apiSuccess {string}   results.receivingStation            The Ground Station that received the data.
 * @apiSuccess {string}   results.sceneStartTime              Year, Day of year and GMT spacecraft start
 * time of either the first major frame of the interval or the start of a WRS scene
 * @apiSuccess {string}   results.sceneStopTime               Year, Day of year and GMT spacecraft stop
 * time of either the last major frame of the interval or the stop of a WRS scene
 * @apiSuccess {number}   results.imageQuality1               Composite image quality for the bands.
 * For Landsat 8, if scene is OLI or OLI_TIRS combined, value will reflect OLI quality score.
 * If TIRS, the TIRS quality score will be used
 * @apiSuccess {string}   results.DATA_TYPE_L1                Data type identifier string used to create the L1 product
 * @apiSuccess {number}   results.GEOMETRIC_RMSE_MODEL_X      RMSE of the geometric residuals (meters) measured
 * on the GCPs used in geometric precision correction
 * @apiSuccess {number}   results.GEOMETRIC_RMSE_MODEL_Y      RMSE of the geometric residuals (meters) measured
 * on the GCPs used in geometric precision correction
 * @apiSuccess {string}   results.NADIR_OFFNADIR              Nadir or Off-Nadir condition of the interval or scene
 * @apiSuccess {object}   results.boundingBox                 Scene's bounding box coordinates
**/
