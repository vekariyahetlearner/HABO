package com.heatmaps.app;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override public void onCreate(android.os.Bundle savedInstanceState) {
    registerPlugin(HabitWidgetPlugin.class);
    super.onCreate(savedInstanceState);
  }
}
