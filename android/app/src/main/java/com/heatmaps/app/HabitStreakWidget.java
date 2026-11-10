package com.heatmaps.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class HabitStreakWidget extends AppWidgetProvider {
  static final String PREFS = "heatmaps_habit_widgets";
  static final String DATA = "habits";
  static final String HABIT_PREFIX = "habit_";

  static void update(Context context, AppWidgetManager manager, int widgetId) {
    android.os.Bundle options = manager.getAppWidgetOptions(widgetId);
    // Launchers report both a minimum and maximum allocation. The maximum is
    // the reliable value after a user has resized a widget, so use whichever
    // one is larger. A ratio, not a fixed cell count, selects the composition.
    int width = Math.max(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0), options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0));
    int height = Math.max(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0), options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0));
    if (width == 0) width = 180;
    if (height == 0) height = 90;
    int layout = width >= height * 1.45f ? R.layout.habit_streak_widget_wide
      : height >= width * 1.15f ? R.layout.habit_streak_widget_tall
      : (width < 145 || height < 88) ? R.layout.habit_streak_widget_compact
      : R.layout.habit_streak_widget;
    RemoteViews views = new RemoteViews(context.getPackageName(), layout);
    String habitId = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(HABIT_PREFIX + widgetId, "");
    String title = "Choose a habit";
    String streak = "Add widget";
    try {
      JSONArray habits = new JSONArray(context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(DATA, "[]"));
      for (int i = 0; i < habits.length(); i++) {
        JSONObject habit = habits.getJSONObject(i);
        if (habitId.equals(habit.optString("id"))) {
          title = habit.optString("title", "Habit");
          streak = habit.optInt("streak", 0) + " day streak";
          break;
        }
      }
    } catch (Exception ignored) { }
    views.setTextViewText(R.id.widget_title, title);
    // A narrow tile cannot fit the phrase "day streak" without truncating;
    // the full label remains available in every larger composition.
    String displayedStreak = layout == R.layout.habit_streak_widget_compact && streak.matches("\\d+ day streak")
      ? streak.replace(" day streak", "d") : streak;
    views.setTextViewText(R.id.widget_streak, displayedStreak);
    Intent open = new Intent(context, MainActivity.class);
    PendingIntent pending = PendingIntent.getActivity(context, widgetId, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    views.setOnClickPendingIntent(R.id.widget_title, pending);
    views.setOnClickPendingIntent(R.id.widget_streak, pending);
    manager.updateAppWidget(widgetId, views);
  }

  static void updateAll(Context context) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    int[] ids = manager.getAppWidgetIds(new ComponentName(context, HabitStreakWidget.class));
    for (int id : ids) update(context, manager, id);
  }

  @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
    for (int id : ids) update(context, manager, id);
  }

  @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int widgetId, android.os.Bundle options) {
    update(context, manager, widgetId);
  }
}
