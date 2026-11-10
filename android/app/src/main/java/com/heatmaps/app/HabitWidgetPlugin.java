package com.heatmaps.app;

import android.content.Context;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "HabitWidget")
public class HabitWidgetPlugin extends Plugin {
  @PluginMethod
  public void sync(PluginCall call) {
    JSArray habits = call.getArray("habits", new JSArray());
    getContext().getSharedPreferences(HabitStreakWidget.PREFS, Context.MODE_PRIVATE)
      .edit().putString(HabitStreakWidget.DATA, habits.toString()).apply();
    HabitStreakWidget.updateAll(getContext());
    MonthlyHabitWidget.updateAll(getContext());
    YearHeatmapWidget.updateAll(getContext());
    call.resolve();
  }
}
