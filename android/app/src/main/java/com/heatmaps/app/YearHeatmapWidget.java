package com.heatmaps.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.widget.RemoteViews;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Fixed 2x4 widget: a complete, legible 53-week heatmap rendered as one bitmap. */
public class YearHeatmapWidget extends AppWidgetProvider {
  static final String HABIT_PREFIX = "year_heatmap_habit_";

  static void update(Context context, AppWidgetManager manager, int widgetId) {
    RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.year_heatmap_widget);
    String habitId = context.getSharedPreferences(HabitStreakWidget.PREFS, Context.MODE_PRIVATE).getString(HABIT_PREFIX + widgetId, "");
    String title = "Choose a habit";
    HashSet<String> completed = new HashSet<>();
    try {
      JSONArray habits = new JSONArray(context.getSharedPreferences(HabitStreakWidget.PREFS, Context.MODE_PRIVATE).getString(HabitStreakWidget.DATA, "[]"));
      for (int i = 0; i < habits.length(); i++) {
        JSONObject habit = habits.getJSONObject(i);
        if (habitId.equals(habit.optString("id"))) {
          title = habit.optString("title", "Habit");
          JSONArray dates = habit.optJSONArray("completedDates");
          if (dates != null) for (int j = 0; j < dates.length(); j++) completed.add(dates.optString(j));
          break;
        }
      }
    } catch (Exception ignored) { }

    Calendar today = Calendar.getInstance();
    int year = today.get(Calendar.YEAR);
    int complete = 0;
    Calendar cursor = Calendar.getInstance(); cursor.clear(); cursor.set(year, Calendar.JANUARY, 1);
    int days = cursor.getActualMaximum(Calendar.DAY_OF_YEAR);
    for (int day = 0; day < days; day++) {
      if (completed.contains(String.format(Locale.US, "%04d-%02d-%02d", cursor.get(Calendar.YEAR), cursor.get(Calendar.MONTH) + 1, cursor.get(Calendar.DAY_OF_MONTH)))) complete++;
      cursor.add(Calendar.DAY_OF_YEAR, 1);
    }
    views.setTextViewText(R.id.year_title, title);
    views.setTextViewText(R.id.year_summary, year + "  •  " + complete + " completed days");
    android.os.Bundle options = manager.getAppWidgetOptions(widgetId);
    int width = Math.max(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0), options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 0));
    int height = Math.max(options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0), options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 0));
    views.setImageViewBitmap(R.id.year_heatmap, drawHeatmap(year, completed, width > height));
    Intent open = new Intent(context, MainActivity.class);
    PendingIntent pending = PendingIntent.getActivity(context, widgetId, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    views.setOnClickPendingIntent(R.id.year_heatmap, pending);
    views.setOnClickPendingIntent(R.id.year_title, pending);
    manager.updateAppWidget(widgetId, views);
  }

  private static Bitmap drawHeatmap(int year, HashSet<String> completed, boolean landscape) {
    // A calendar mosaic is substantially more legible than a 53-column strip.
    // It preserves every date while using the widget's available aspect ratio.
    final int monthColumns = landscape ? 4 : 3, monthRows = landscape ? 3 : 4;
    final int cell = 9, gap = 2, monthPadding = 5, labelHeight = 16;
    final int blockWidth = 7 * (cell + gap) + monthPadding * 2;
    final int blockHeight = labelHeight + 6 * (cell + gap) + monthPadding * 2;
    Bitmap bitmap = Bitmap.createBitmap(monthColumns * blockWidth, monthRows * blockHeight, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(bitmap); Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    Paint label = new Paint(Paint.ANTI_ALIAS_FLAG); label.setColor(Color.rgb(158, 162, 174)); label.setTextSize(10); label.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
    String[] labels = {"JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"};
    for (int month = 0; month < 12; month++) {
      int blockCol = month % monthColumns, blockRow = month / monthColumns;
      float originX = blockCol * blockWidth, originY = blockRow * blockHeight;
      canvas.drawText(labels[month], originX + monthPadding, originY + 11, label);
      Calendar cursor = Calendar.getInstance(); cursor.clear(); cursor.set(year, month, 1);
      int start = (cursor.get(Calendar.DAY_OF_WEEK) + 5) % 7, days = cursor.getActualMaximum(Calendar.DAY_OF_MONTH);
      for (int day = 1; day <= days; day++) {
        int index = start + day - 1, col = index % 7, row = index / 7;
        float x = originX + monthPadding + col * (cell + gap), y = originY + labelHeight + monthPadding + row * (cell + gap);
        String date = String.format(Locale.US, "%04d-%02d-%02d", year, month + 1, day);
        paint.setColor(completed.contains(date) ? Color.rgb(34, 197, 94) : Color.rgb(41, 43, 51));
        canvas.drawRoundRect(new RectF(x, y, x + cell, y + cell), 2, 2, paint);
      }
    }
    return bitmap;
  }

  static void updateAll(Context context) {
    AppWidgetManager manager = AppWidgetManager.getInstance(context);
    int[] ids = manager.getAppWidgetIds(new ComponentName(context, YearHeatmapWidget.class));
    for (int id : ids) update(context, manager, id);
  }
  @Override public void onUpdate(Context context, AppWidgetManager manager, int[] ids) { for (int id : ids) update(context, manager, id); }
  @Override public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int widgetId, android.os.Bundle options) { update(context, manager, widgetId); }
}
