import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import deviceImage from '../assets/device.png';

export function LandingPage() {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="font-sans text-slate-900 bg-[#f8fafc] scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-slate-200/60 bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img 
                alt="BlueHotel Logo" 
                className="h-32 w-32 sm:h-40 sm:w-40" 
                src={logoImage}
              />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" 
                href="#features"
              >
                Tính năng nội bộ
              </a>
              <a 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" 
                href="#benefits"
              >
                Lợi ích vận hành
              </a>
              <a 
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors" 
                href="#contact"
              >
                Liên hệ
              </a>
              <button 
                className="bg-blue-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-blue-700 transition-all text-sm"
                onClick={handleGetStarted}
              >
                Dùng thử miễn phí
              </button>
            </div>
            {isMobile && (
              <button 
                className="bg-blue-600 text-white px-3 py-2 rounded-md font-semibold text-xs"
                onClick={handleGetStarted}
              >
                Dùng thử
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 sm:pt-32 sm:pb-24 lg:pt-44 lg:pb-40 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 sm:mb-6 text-xs font-bold tracking-wide text-blue-600 uppercase bg-blue-50 rounded-full border border-blue-100">
                <span className="material-symbols-outlined text-sm">verified</span>
                Giải pháp PMS chuyên sâu
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight text-slate-900">
                Quản Lý Vận Hành Khách Sạn <br className="hidden sm:block"/>
                <span className="text-blue-600">Nội Bộ - Dùng Thử Miễn Phí</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-500 mb-6 sm:mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                BlueHotel là hệ thống quản lý khách sạn (PMS) chuyên nghiệp giúp số hóa toàn bộ quy trình vận hành nội bộ: từ sơ đồ phòng, lễ tân đến bộ phận dọn phòng và báo cáo tài chính.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <button 
                  className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                  onClick={handleGetStarted}
                >
                  Dùng thử miễn phí ngay
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
                <button 
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-sm sm:text-base border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  onClick={handleContact}
                >
                  Xem hướng dẫn
                </button>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Dùng thử 30 ngày
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Không giới hạn phòng
                </div>
              </div>
            </div>
            <div className="relative order-1 lg:order-2">
              <div className="absolute inset-0 bg-blue-50 rounded-3xl -rotate-2 transform scale-105 opacity-50"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" style={{ height: '400px' }}>
                <img 
                  alt="BlueHotel Dashboard" 
                  className="w-full h-full transform scale-110" 
                  src={deviceImage}
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-[#f8fafc]" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900">Tính năng quản lý khách sạn chuyên sâu</h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
            BlueHotel cung cấp giải pháp PMS toàn diện cho khách sạn Việt Nam. Tối ưu hóa vận hành, tăng doanh thu và nâng cao trải nghiệm khách hàng.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="material-symbols-outlined text-xl sm:text-2xl">bed</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-slate-900">Quản lý phòng thông minh</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Theo dõi real-time tình trạng phòng: Đang ở, Phòng trống, Chờ dọn, Bảo trì. Tối ưu hóa tỷ lệ lấp đầy phòng.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="material-symbols-outlined text-xl sm:text-2xl">event_note</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-slate-900">Hoạt động hôm nay</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Nắm bắt nhanh danh sách Check-in, Check-out và các yêu cầu dịch vụ đặc biệt trong ngày.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="material-symbols-outlined text-xl sm:text-2xl">person_pin_circle</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-slate-900">Lễ tân & Housekeeping</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Hệ thống phân quyền nhân viên rõ ràng. Tối ưu hóa quy trình check-in/out và giao tiếp giữa các bộ phận.
              </p>
            </div>
            <div className="p-4 sm:p-6 bg-white rounded-xl border border-slate-200 hover:border-blue-500/50 transition-all group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <span className="material-symbols-outlined text-xl sm:text-2xl">analytics</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-slate-900">Báo cáo & Phân tích</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Dashboard thông minh với báo cáo doanh thu, ADR, RevPAR, tỷ lệ lấp đầy. Hỗ trợ ra quyết định kinh doanh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white" id="benefits">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-12 lg:gap-16">
            <div className="lg:w-1/2 space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="inline-block px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded uppercase">
                Thương hiệu là của bạn
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight text-slate-900">
                Tối ưu vận hành cho <br className="hidden sm:block"/>Thương hiệu Khách sạn
              </h2>
              <p className="text-slate-500 text-base sm:text-lg leading-relaxed">
                Khác với các trang Booking lấy đi 15-20% hoa hồng, BlueHotel giúp bạn quản lý nội bộ hiệu quả. 
                Chúng tôi tập trung vào việc tối ưu hóa quy trình vận hành để giảm sai sót và tăng lợi nhuận. Dùng thử 30 ngày miễn phí.
              </p>
              <ul className="space-y-3 sm:space-y-4">
                <li className="flex items-center gap-3 text-slate-700 font-medium text-sm sm:text-base">
                  <span className="text-blue-600 text-lg">✓</span>
                  Giảm sai sót trong quản lý phòng và khách hàng
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium text-sm sm:text-base">
                  <span className="text-blue-600 text-lg">✓</span>
                  Tăng hiệu quả giao tiếp giữa các bộ phận
                </li>
                <li className="flex items-center gap-3 text-slate-700 font-medium text-sm sm:text-base">
                  <span className="text-blue-600 text-lg">✓</span>
                  Hệ thống báo cáo tự động và minh bạch
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-100 text-center">
                <img 
                  alt="BlueHotel" 
                  className="mx-auto mb-4 sm:mb-6" 
                  src={deviceImage}
                  style={{ height: '200px', width: 'auto', objectFit: 'contain' }}
                />
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">Giải pháp toàn diện</h3>
                <p className="text-slate-500 text-sm sm:text-base">
                  Từ quản lý phòng đến báo cáo doanh thu, tất cả trong một hệ thống duy nhất.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">10k+</div>
              <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Phòng đang vận hành</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">30 ngày</div>
              <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Dùng thử miễn phí</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">24/7</div>
              <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Hỗ trợ vận hành</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">PMS</div>
              <div className="text-slate-400 text-xs sm:text-sm uppercase tracking-wider">Chuyên nghiệp</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-20 bg-blue-600 text-white" id="contact">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Sẵn sàng bắt đầu?</h2>
          <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90">
            Liên hệ với chúng tôi để được tư vấn miễn phí và trải nghiệm hệ thống
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined">phone</span>
              <a href="tel:0395752407" className="hover:text-white transition-colors">0395 752 407</a>
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <span className="material-symbols-outlined">email</span>
              <a href="mailto:support.bluehotel@gmail.com" className="hover:text-white transition-colors">support.bluehotel@gmail.com</a>
            </div>
          </div>
          <button 
            className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-100 transition-all"
            onClick={handleGetStarted}
          >
            Dùng thử miễn phí ngay
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-16 sm:pt-20 pb-8 sm:pb-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12 sm:mb-16">
            <div className="col-span-full sm:col-span-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-4 sm:mb-6">
                <img 
                  alt="BlueHotel Logo" 
                  className="h-28 w-28 sm:h-32 sm:w-32" 
                  src={logoImage}
                />
                <span className="text-base sm:text-lg font-bold text-slate-900">BlueHotel</span>
              </div>
              <p className="text-slate-500 max-w-sm mx-auto sm:mx-0 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
                BlueHotel - Phần mềm quản lý khách sạn PMS số 1 Việt Nam. Dùng thử miễn phí 30 ngày với đầy đủ tính năng: 
                quản lý phòng, front desk, housekeeping, báo cáo doanh thu. Hỗ trợ khách sạn từ 10-500 phòng.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 sm:mb-6 text-slate-900 text-sm sm:text-base">Tính năng PMS</h4>
              <ul className="space-y-3 sm:space-y-4 text-slate-500 text-xs sm:text-sm">
                <li><a className="hover:text-blue-600 transition-colors" href="#features">Quản lý phòng khách sạn</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="#features">Hệ thống Front Desk</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="#features">Phần mềm Housekeeping</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="#features">Báo cáo doanh thu ADR RevPAR</a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-bold mb-4 sm:mb-6 text-slate-900 text-sm sm:text-base">Hỗ trợ khách hàng</h4>
              <ul className="space-y-3 sm:space-y-4 text-slate-500 text-xs sm:text-sm">
                <li><a className="hover:text-blue-600 transition-colors" href="#contact">Hướng dẫn sử dụng PMS</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="#contact">Cộng đồng khách sạn Việt Nam</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="tel:0395752407">Hotline: 0395 752 407</a></li>
                <li><a className="hover:text-blue-600 transition-colors" href="mailto:support.bluehotel@gmail.com">Email: support.bluehotel@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 sm:pt-8 border-t border-slate-50 text-center text-xs text-slate-400">
            <p>© 2024 BlueHotel - Phần mềm quản lý khách sạn PMS Việt Nam. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}