import { Space, Dropdown, Button } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';
import { useTheme, themeColors, type ThemeColor } from '../contexts/ThemeContext';

/**
 * ThemeSwitcher component
 * Displays a dropdown to select theme color
 */
export function ThemeSwitcher() {
  const { color, setColor } = useTheme();

  const colorMenuItems = (Object.keys(themeColors) as ThemeColor[]).map((colorOption) => ({
    key: colorOption,
    label: (
      <Space>
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            backgroundColor: themeColors[colorOption],
            border: color === colorOption ? '2px solid #000' : '1px solid #d9d9d9',
          }}
        />
        <span style={{ textTransform: 'capitalize' }}>{colorOption}</span>
      </Space>
    ),
    onClick: () => setColor(colorOption),
  }));

  return (
    <Dropdown menu={{ items: colorMenuItems }} placement="bottomRight">
      <Button icon={<BgColorsOutlined />} title="Change Theme Color" />
    </Dropdown>
  );
}
