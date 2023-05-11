# Date Handling

The GeoView application uses two data types to process dates internally. The type of data used varies depending on the layer. All vector layers use numbers and, so far, the raster layers that can be queried use strings. In addition, dates are internally considered as beeing coded in Universal Coordinated Time (UTC) and the time reference for numeric dates is the elapsed time in miliseconds since midnight on January 1, 1970. By default, if you do not use the configuration settings to change the date format, the viewer will use the ISO UTC standard for its input/output.

To be a date, a field must be declared as such in the metadata returned by the service or in the geoview configuration, the latter taking precedence over the former. Sometimes some services do not format their date fields according to ISO UTC standards. This is the case for dynamic ESRI layers which will force the use of the DD/MM/YYYY format since this is the format used by all the services of this type that we have tested so for. For other layer types, the viewer will attempt to infer the date format. However, inferance has its limits. The algorithm can easily infer the format when it is DD/MM/YYYY or YYYY/MM/DD, but it will fail to detect the MM/DD/YYYY format.  In this case, the user has no other choice but to use the `serviceDateFormat` configuration parameter to provide the viewer with the format used by the server so that it can perform the desired conversion. It is not necessary to use this parameter if the dates are already in ISO UTC. It is important to keep in mind that the `serviceDateFormat` parameter is only used to tell the viewer how to translate the dates returned by the server into the universal UTC zone used internally by the viewer.

When the users use dates when interacting with the viewer, they must use the ISO UTC format. The interaction areas with the viewer are: the values returned by the `getFeatureInfo` method; the configuration file parameter `layerFilter` and the filters used by the `setViewFilter` method. If the users don't want to use the ISO UTC format, they must provide the format they want to use in the configuration file using the `externalDateFormat` parameter. When this parameter is used, all interactions with the viewer must respect the new date format.

Ok But, from a programmer's point of view, how does it work? Well, when the user applies a view filter, the viewer will convert the filter's date constants (those with the syntax date '...') from the display format to the format used by the server. If no time zone is specified, the conversion will use the inverse of the time zone specified in the `externalDateFormat` to get the correspondinf ISO UTC date. When a time zone is specified, the date conversion will use it to get the corresponding ISO UTC date.

When using the `getFeatureInfo` method, if the result contains a date, it will be converted to a string respecting the ISO UTC date format if no `externalDateFormat` is used in the configuration file. This conversion from internal format to a string is done for display purposes. The user can choose to reformat this date according to a patern by specifying the date fields he wants to keep using the `externalDateFormat` configuration parameter. This transformation will also change the date to the zone specified in the format. It is imperative that all interactions with the viewer respect the `externalDateFormat` otherwise conversion errors will be logged in the console and request processing will be interrupted.

We have put a lot of effort into ensuring that the behavior when manipulating date fields is consistent across GeoView layer types. The viewer input routines accept a dash or slash as a date separator and a space or "T" as a date and time separator. ESRI Dynamic layers do not support the use of an ISO date format. The 'T' separator normally placed between the date and time is not recognized, a space must be used instead. Also, the time zone is not accepted. To solve this problem, the time zone will be cut off and the time separator will be replaced by a space when the a query is sent to the server. These operations are done in the background by the viewer in order to present a uniform behavior in the user interface. Another place where dates are not used as mentioned in the service documentation of the underlying layer is in the WMS layers. The temporal filter cannot be written as mentioned in the specifcations. The dates must be presented using the `date '...'` operator in order for them to be correctly processed by the viewer. The translation to the format expected by the service will be done in the background.

When using the `serviceDateFormat` and `externalDateFormat` parameters in the configuration files, you must specify a complete date format. Accepted formats are : 'YYYY-MM-DDTHH:MM:SS(time zone)', 'MM-DD-YYYYTHH:MM:SS(time zone) and 'DD-MM-YYYYTHH:MM:SS(time zone) where (time zone) can be 'Z', +99:99 or -99:99. As mentioned above, you can use '/' instead of '-' and ' ' instead of 'T'. For example, a valid date format could be 'MM/DD/YYY HH:MM:SS-05:00' or 'MM/DD/YYYTHH:MM:SSZ'.

The `externalDateFormat` configuration parameter also allows you to remove sections of a date/time that you don't want to see on the output. To do this, use the square brackets to enclose the section to be removed. However, you can't cut anywhere. Here is the list of formats using field deletion that can be used:
<p>&nbsp;</p>
<p align="center">
  'YYYY-MM-DD[THH:MM:SSZ]'</br>
  'YYYY-MM[-DDTHH:MM:SSZ]'</br>
  'YYYY[-MM-DDTHH:MM:SSZ]'</br>
</br>
  'MM-DD-YYYY[THH:MM:SSZ]'</br>
  'MM-[DD-]YYYY[THH:MM:SSZ]'</br>
  '[MM-DD-]YYYY[THH:MM:SSZ]'</br>
</br>
  'DD-MM-YYYY[THH:MM:SSZ]'</br>
  '[DD-]MM-YYYY[THH:MM:SSZ]'</br>
  '[DD-MM-]YYYY[THH:MM:SSZ]'</br>
</br>
Keep in mind that the '-' in a date can be replaces by a '/' and the 'T' separator by a ' '. The time zone can be 'Z', +99:99 or -99:99.
</p>
