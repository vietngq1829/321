import { SfxType, VideoStylePreset, AspectRatio } from '../types';

export interface ScriptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  stylePreset: VideoStylePreset;
  aspectRatio: AspectRatio;
  script: string;
  previewImage: string;
  initialScenes: {
    narration: string;
    visualPrompt: string;
    visualUrl: string;
    duration: number;
    cameraMotion: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'subtle-drift';
    sfx?: string;
    sfxType?: SfxType;
    sfxTiming?: 'start' | 'mid' | 'end';
  }[];
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'cosmic-blackhole',
    title: 'Bí Ẩn Hố Đen & Vũ Trụ Bao La',
    category: 'Khoa Học & Thiên Văn',
    description: 'Khám phá bí ẩn lớn nhất của vũ trụ với phân cảnh điện ảnh sâu thẳm.',
    stylePreset: 'cinematic',
    aspectRatio: '16:9',
    previewImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
    script: 'Ở trung tâm của những thiên hà xa xôi, tồn tại những thực thể bí ẩn nhất vũ trụ: Hố Đen. Lực hấp dẫn của chúng mãnh liệt đến mức ngay cả ánh sáng cũng không thể trốn thoát. Khi vật chất tiến vào Chân Trời Sự Kiện, không gian và thời gian bị bẻ cong hoàn toàn. Vũ trụ rộng lớn ngoài kia vẫn đang ẩn giấu vô vàn điều kỳ diệu chờ đón con người khám phá.',
    initialScenes: [
      {
        narration: 'Ở trung tâm của những thiên hà xa xôi, tồn tại những thực thể bí ẩn nhất vũ trụ: Hố Đen.',
        visualPrompt: 'Cinematic deep space shot of a massive swirling black hole glowing with golden accretion disk, nebula stars in background, photorealistic 8k',
        visualUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=80',
        duration: 5.5,
        cameraMotion: 'zoom-in',
        sfx: 'Whoosh không gian & Sub-Bass trầm',
        sfxType: 'whoosh',
        sfxTiming: 'start',
      },
      {
        narration: 'Lực hấp dẫn của chúng mãnh liệt đến mức ngay cả ánh sáng cũng không thể trốn thoát.',
        visualPrompt: 'Supermassive gravitational lensing bending starlight around a dark singularity, epic interstellar scene, cosmic dust glowing',
        visualUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
        duration: 5.0,
        cameraMotion: 'pan-left',
        sfx: 'Boom chấn động không thời gian (Impact)',
        sfxType: 'boom_impact',
        sfxTiming: 'start',
      },
      {
        narration: 'Khi vật chất tiến vào Chân Trời Sự Kiện, không gian và thời gian bị bẻ cong hoàn toàn.',
        visualPrompt: 'Event horizon warp tunnel, cosmic particles streaming into infinite depth, hyper-detailed cosmic rendering, deep blues and glowing purples',
        visualUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
        duration: 5.5,
        cameraMotion: 'zoom-out',
        sfx: 'Riser cao trào dồn dập',
        sfxType: 'riser',
        sfxTiming: 'mid',
      },
      {
        narration: 'Vũ trụ rộng lớn ngoài kia vẫn đang ẩn giấu vô vàn điều kỳ diệu chờ đón con người khám phá.',
        visualPrompt: 'A futuristic astronaut looking out from a spaceship observatory window at majestic glowing galaxies, cinematic lighting',
        visualUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80',
        duration: 5.2,
        cameraMotion: 'subtle-drift',
        sfx: 'Hợp âm pha lê ngân vang',
        sfxType: 'bell',
        sfxTiming: 'start',
      },
    ],
  },
  {
    id: 'ai-future',
    title: 'Trí Tuệ Nhân Tạo & Kỷ Nguyên Tương Lai',
    category: 'Công Nghệ 4.0',
    description: 'Thước phim công nghệ hiện đại về sự bùng nổ của AI trong cuộc sống số.',
    stylePreset: 'tech_modern',
    aspectRatio: '9:16',
    previewImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    script: 'Chúng ta đang bước vào một kỷ nguyên hoàn toàn mới: Kỷ nguyên của Trí Tuệ Nhân Tạo. AI không chỉ tự động hóa công việc mà còn mở ra những khả năng sáng tạo không giới hạn. Từ phân tích dữ liệu lượng tử đến chế tạo robot thông minh. Tương lai thuộc về những ai biết làm chủ công nghệ và biến ước mơ thành hiện thực.',
    initialScenes: [
      {
        narration: 'Chúng ta đang bước vào một kỷ nguyên hoàn toàn mới: Kỷ nguyên của Trí Tuệ Nhân Tạo.',
        visualPrompt: 'Futuristic AI neural network glowing nodes floating in cyber city at night, neon cyan and violet reflections, vertical portrait 9:16',
        visualUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        duration: 5.0,
        cameraMotion: 'zoom-in',
        sfx: 'Cyber Telemetry Beep tương lai',
        sfxType: 'cyber_beep',
        sfxTiming: 'start',
      },
      {
        narration: 'AI không chỉ tự động hóa công việc mà còn mở ra những khả năng sáng tạo không giới hạn.',
        visualPrompt: 'Holographic cybernetic interface with AI digital brain glowing with intelligence, sleek glass architecture, 8k quality',
        visualUrl: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        duration: 5.2,
        cameraMotion: 'pan-right',
        sfx: 'Tia Laser quét giao diện Hologram',
        sfxType: 'laser',
        sfxTiming: 'start',
      },
      {
        narration: 'Từ phân tích dữ liệu lượng tử đến chế tạo robot hình người thông minh hỗ trợ nhân loại.',
        visualPrompt: 'Futuristic advanced humanoid robot looking forward with soft glowing eyes in high-tech laboratory, photorealistic render',
        visualUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
        duration: 5.5,
        cameraMotion: 'subtle-drift',
        sfx: 'Tiếng gõ phím vi tính lượng tử',
        sfxType: 'typewriter',
        sfxTiming: 'start',
      },
      {
        narration: 'Tương lai thuộc về những ai biết làm chủ công nghệ và biến ước mơ thành hiện thực!',
        visualPrompt: 'Digital metropolis with flying vehicles and glowing skyline, inspirational cyber sunrise, high energy vertical composition',
        visualUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=800&q=80',
        duration: 5.0,
        cameraMotion: 'zoom-out',
        sfx: 'Sparkle thăng hoa công nghệ',
        sfxType: 'magic_sparkle',
        sfxTiming: 'start',
      },
    ],
  },
  {
    id: 'mindset-success',
    title: 'Sức Mạnh Của Kỷ Luật Tự Thân',
    category: 'Phát Triển Bản Thân',
    description: 'Video ngắn truyền động lực mạnh mẽ phong cách TikTok/Reels cuốn hút.',
    stylePreset: 'tiktok_viral',
    aspectRatio: '9:16',
    previewImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    script: 'Động lực giúp bạn bắt đầu, nhưng kỷ luật mới là thứ đưa bạn về đích. Mỗi buổi sáng bạn thức dậy, bạn có hai lựa chọn: tiếp tục ngủ và mơ, hoặc thức dậy và hành động. Đừng đợi đến khi hoàn hảo mới làm, hãy làm để trở nên hoàn hảo hơn mỗi ngày.',
    initialScenes: [
      {
        narration: 'Động lực giúp bạn bắt đầu, nhưng kỷ luật mới là thứ đưa bạn về đích.',
        visualPrompt: 'Athlete tying running shoes at dawn in dramatic mist, golden morning rays, intense focus and determination, vertical 9:16',
        visualUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
        duration: 4.8,
        cameraMotion: 'zoom-in',
        sfx: 'Whoosh bắt nhịp năng lượng',
        sfxType: 'whoosh',
        sfxTiming: 'start',
      },
      {
        narration: 'Mỗi buổi sáng thức dậy, bạn có hai lựa chọn: tiếp tục ngủ và mơ, hoặc hành động!',
        visualPrompt: 'Silhouetted person running up a mountain trail at sunrise, vibrant sky, cinematic high contrast lighting',
        visualUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
        duration: 5.0,
        cameraMotion: 'pan-left',
        sfx: 'Boom chấn động quyết tâm',
        sfxType: 'boom_impact',
        sfxTiming: 'start',
      },
      {
        narration: 'Đừng đợi đến khi hoàn hảo mới làm, hãy làm để trở nên hoàn hảo hơn mỗi ngày.',
        visualPrompt: 'A visionary standing at the summit of a misty mountain looking at endless horizons, inspiring golden hour glow',
        visualUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        duration: 5.2,
        cameraMotion: 'zoom-out',
        sfx: 'Tràng vỗ tay tán thưởng',
        sfxType: 'applause',
        sfxTiming: 'end',
      },
    ],
  },
  {
    id: 'nature-journey',
    title: 'Hùng Vĩ Thiên Nhiên Việt Nam',
    category: 'Du Lịch & Khám Phá',
    description: 'Khung cảnh thiên nhiên tráng lệ từ ruộng bậc thang đến hang động kỳ vĩ.',
    stylePreset: 'storytelling',
    aspectRatio: '16:9',
    previewImage: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
    script: 'Việt Nam – mảnh đất hình chữ S mang trong mình vẻ đẹp diệu kỳ của tạo hóa. Từ những thửa ruộng bậc thang vàng óng uốn lượn lưng chừng mây Tây Bắc, đến những bãi biển xanh ngắt rì rào sóng vỗ miền Trung. Mỗi tấc đất, mỗi dòng sông đều kể một câu chuyện ngàn năm bất tận.',
    initialScenes: [
      {
        narration: 'Việt Nam – mảnh đất hình chữ S mang trong mình vẻ đẹp diệu kỳ của tạo hóa.',
        visualPrompt: 'Spectacular aerial drone view of Mu Cang Chai golden rice terraces in morning golden mist, breathtaking green and gold layers',
        visualUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80',
        duration: 5.0,
        cameraMotion: 'zoom-in',
        sfx: 'Tiếng gió thoảng thiên nhiên',
        sfxType: 'ambient_nature',
        sfxTiming: 'start',
      },
      {
        narration: 'Từ những thửa ruộng bậc thang vàng óng uốn lượn lưng chừng mây Tây Bắc tráng lệ.',
        visualPrompt: 'Misty majestic mountain ranges in Ha Giang Vietnam, dramatic limestone peaks piercing white clouds, cinematic sunrise',
        visualUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
        duration: 5.2,
        cameraMotion: 'pan-right',
        sfx: 'Chụp ảnh khoảnh khắc đẹp (Shutter)',
        sfxType: 'shutter',
        sfxTiming: 'mid',
      },
      {
        narration: 'Đến những bờ biển xanh ngắt rì rào sóng vỗ miền Trung đầy nắng và gió.',
        visualPrompt: 'Crystal clear emerald bay with limestone karst islands, traditional wooden boat sailing, tropical sun rays, Halong Bay vibes',
        visualUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        duration: 5.0,
        cameraMotion: 'subtle-drift',
        sfx: 'Gió biển & tiếng sóng êm đềm',
        sfxType: 'ambient_nature',
        sfxTiming: 'start',
      },
      {
        narration: 'Mỗi tấc đất, mỗi dòng sông đều kể một câu chuyện ngàn năm bất tận.',
        visualPrompt: 'A peaceful sunset over ancient river with lanterns glowing, cultural heritage atmosphere, peaceful serenity',
        visualUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80',
        duration: 4.8,
        cameraMotion: 'zoom-out',
        sfx: 'Chuông pha lê ngân vang',
        sfxType: 'bell',
        sfxTiming: 'start',
      },
    ],
  },
];
