package com.heatmaps.app;

import android.app.Activity;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

public class HabitWidgetConfigureActivity extends Activity {
  private int widgetId = AppWidgetManager.INVALID_APPWIDGET_ID;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    widgetId = getIntent().getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId);
    if (widgetId == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return; }
    LinearLayout list = new LinearLayout(this); list.setOrientation(LinearLayout.VERTICAL); list.setPadding(36, 36, 36, 36);
    TextView heading = new TextView(this); heading.setText("Choose a HeatMaps habit"); heading.setTextSize(20); heading.setPadding(0, 0, 0, 24); list.addView(heading);
    try {
      JSONArray habits = new JSONArray(getSharedPreferences(HabitStreakWidget.PREFS, MODE_PRIVATE).getString(HabitStreakWidget.DATA, "[]"));
      for (int i = 0; i < habits.length(); i++) {
        JSONObject habit = habits.getJSONObject(i); TextView row = new TextView(this);
        row.setText(habit.optString("title", "Habit") + "  •  " + habit.optInt("streak", 0) + " day streak"); row.setTextSize(17); row.setPadding(0, 22, 0, 22);
        final String habitId = habit.optString("id"); row.setOnClickListener(v -> select(habitId)); list.addView(row);
      }
    } catch (Exception ignored) { }
    setContentView(list);
  }
  private void select(String habitId) {
    getSharedPreferences(HabitStreakWidget.PREFS, MODE_PRIVATE).edit().putString(HabitStreakWidget.HABIT_PREFIX + widgetId, habitId).apply();
    HabitStreakWidget.update(this, AppWidgetManager.getInstance(this), widgetId);
    Intent result = new Intent(); result.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, widgetId); setResult(RESULT_OK, result); finish();
  }
}
