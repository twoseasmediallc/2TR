import { ShoppingCart, Package, Search, Upload, X, CheckCircle, AlertCircle, Loader2, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SuccessPage } from './pages/SuccessPage';
import { uploadDesignImage, createCustomRugOrder } from './lib/customRugs';
import { fetchPremadeRugs, type PremadeRug } from './lib/premadeRugs';
import { lookupTracking, getOrderStageIndex, type TrackingInfo } from './lib/tracking';
import { createCheckoutSession, createCheckoutSessionForCart } from './lib/stripe';

function MainApp() {
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<string>('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [backingOption, setBackingOption] = useState<string>('');
  const [cutOption, setCutOption] = useState<string>('');
  const [designFile, setDesignFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    shippingAddressLine1: '',
    shippingAddressLine2: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: 'United States',
  });
  const [premadeRugs, setPremadeRugs] = useState<PremadeRug[]>([]);
  const [isLoadingRugs, setIsLoadingRugs] = useState(true);
  const [rugsError, setRugsError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<PremadeRug[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [selectedRugForGallery, setSelectedRugForGallery] = useState<PremadeRug | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCouponInfo, setShowCouponInfo] = useState(false);

  const formatInchesToFeet = (inches: string) => {
    const totalInches = parseInt(inches);
    const feet = Math.floor(totalInches / 12);
    const remainingInches = totalInches % 12;
    if (remainingInches === 0) {
      return `${feet}'`;
    }
    return `${feet}' ${remainingInches}"`;
  };

  useEffect(() => {
    loadPremadeRugs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadPremadeRugs = async () => {
    setIsLoadingRugs(true);
    setRugsError(null);

    try {
      const { data: dbRugs, error } = await fetchPremadeRugs();
      if (error) {
        setRugsError(error);
        setPremadeRugs([]);
      } else {
        setPremadeRugs(dbRugs || []);
      }
    } catch (err) {
      setRugsError('Failed to load products');
      setPremadeRugs([]);
    }

    setIsLoadingRugs(false);
  };

  const handleAddToCart = (rug: PremadeRug) => {
    if (!rug.stripe_price_id) {
      alert('This rug is not available for purchase at this time.');
      return;
    }
    const quantityInCart = cartItems.filter(item => item.id === rug.id).length;
    if (quantityInCart >= 2) {
      setShowLimitModal(true);
      return;
    }
    setCartItems([...cartItems, rug]);
  };

  const handleRemoveFromCart = (rugId: number) => {
    const index = cartItems.findIndex(item => item.id === rugId);
    if (index !== -1) {
      const updatedCart = [...cartItems];
      updatedCart.splice(index, 1);
      setCartItems(updatedCart);
    }
  };

  const openGallery = (rug: PremadeRug) => {
    setSelectedRugForGallery(rug);
    setCurrentImageIndex(0);
  };

  const closeGallery = () => {
    setSelectedRugForGallery(null);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (selectedRugForGallery) {
      const images = getGalleryImages(selectedRugForGallery);
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const previousImage = () => {
    if (selectedRugForGallery) {
      const images = getGalleryImages(selectedRugForGallery);
      setCurrentImageIndex((prev) =>
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const getGalleryImages = (rug: PremadeRug): string[] => {
    const images: string[] = [];

    if (rug.modal_image1) images.push(rug.modal_image1);
    if (rug.modal_image2) images.push(rug.modal_image2);
    if (rug.modal_image3) images.push(rug.modal_image3);

    if (images.length > 0) {
      return images;
    }

    return rug.image ? [rug.image] : [];
  };

  const handleStripeCheckout = async (priceId: string) => {
    setCheckoutLoading(priceId);

    try {
      const { url } = await createCheckoutSession(priceId, 'payment');
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Unable to process checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleTrackShipment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderNumber.trim()) {
      setTrackingError('Please enter an order number');
      setTrackingInfo(null);
      return;
    }

    setIsTrackingLoading(true);
    setTrackingError(null);
    setTrackingInfo(null);

    const { data, error } = await lookupTracking(orderNumber);

    if (error) {
      setTrackingError(error);
      setTrackingInfo(null);
    } else if (data) {
      setTrackingInfo(data);
      setTrackingError(null);
    }

    setIsTrackingLoading(false);
  };

  const handleCustomOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDimension) {
      setSubmitStatus({ type: 'error', message: 'Please select dimensions for your rug.' });
      return;
    }
    if (selectedDimension === 'custom') {
      if (!customWidth || !customHeight) {
        setSubmitStatus({ type: 'error', message: 'Please select both width and height for custom dimensions.' });
        return;
      }
    }
    if (!backingOption) {
      setSubmitStatus({ type: 'error', message: 'Please select a backing option for your rug.' });
      return;
    }
    if (!cutOption) {
      setSubmitStatus({ type: 'error', message: 'Please select a cut option for your rug.' });
      return;
    }
    setShowModal(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      let imageUrl: string | undefined;

      if (designFile) {
        imageUrl = await uploadDesignImage(designFile);
      }

      const dimensionValue = selectedDimension === 'custom'
        ? `${formatInchesToFeet(customWidth)} x ${formatInchesToFeet(customHeight)}`
        : selectedDimension;

      const result = await createCustomRugOrder({
        name: formData.name,
        email: formData.email,
        description: formData.description,
        dimensions: dimensionValue,
        backing_option: backingOption,
        cut_option: cutOption,
        design_image: imageUrl,
        shipping_address_line1: formData.shippingAddressLine1,
        shipping_address_line2: formData.shippingAddressLine2,
        shipping_city: formData.shippingCity,
        shipping_state: formData.shippingState,
        shipping_zip: formData.shippingZip,
        shipping_country: formData.shippingCountry,
      });

      if (result.success) {
        setSubmitStatus({
          type: 'success',
          message: `Order submitted successfully! Your order number is: ${result.orderNumber}. We'll contact you soon at ${formData.email}.`,
        });

        setFormData({
          name: '',
          email: '',
          description: '',
          shippingAddressLine1: '',
          shippingAddressLine2: '',
          shippingCity: '',
          shippingState: '',
          shippingZip: '',
          shippingCountry: 'United States',
        });
        setDesignFile(null);
        setSelectedDimension('');
        setCustomWidth('');
        setCustomHeight('');
        setBackingOption('');
        setCutOption('');
        setTimeout(() => {
          setShowModal(false);
          setSubmitStatus(null);
        }, 8000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit order. Please try again.',
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300`}>
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white text-center py-2 px-4 text-sm sm:text-base font-medium">
          Free Shipping on All Rugs
        </div>
        <div className={`bg-black/90 backdrop-blur-sm container mx-auto px-2 sm:px-6 transition-all duration-300 ${isScrolled ? 'py-2 sm:py-3' : 'py-3 sm:py-6 lg:py-10'}`}>
          <div className="flex items-center justify-between lg:justify-center relative w-full gap-2 sm:gap-4">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-gray-100 hover:text-orange-500 transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            </button>

            <div className="hidden lg:flex absolute left-0 items-center gap-4 xl:gap-8 whitespace-nowrap">
              <a href="#" className="text-gray-100 hover:text-orange-500 transition-colors text-lg xl:text-xl font-medium tracking-wide">
                Home
              </a>
              <a href="#about" className="text-gray-100 hover:text-orange-500 transition-colors text-lg xl:text-xl font-medium tracking-wide">
                About Us
              </a>
              <a href="#tracker" className="text-gray-100 hover:text-orange-500 transition-colors text-lg xl:text-xl font-medium tracking-wide">
                Shipment Tracker
              </a>
            </div>

            <div className="flex items-center justify-center flex-shrink-0">
              <img
                src="/2tr-logo-final-transparent.png"
                alt="Two Tuft Rugs Logo"
                className={`object-contain transition-all duration-300 ${
                  isScrolled
                    ? 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20'
                    : 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-40 lg:h-40'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8 lg:absolute lg:right-0">
              <a href="#premade" className="hidden lg:block text-gray-100 hover:text-orange-500 transition-colors text-lg xl:text-xl font-medium tracking-wide text-center leading-tight max-w-[120px] xl:max-w-none xl:whitespace-nowrap">
                Pre-made Rugs
              </a>
              <a href="#custom" className="hidden lg:block text-gray-100 hover:text-orange-500 transition-colors text-lg xl:text-xl font-medium tracking-wide text-center leading-tight max-w-[120px] xl:max-w-none xl:whitespace-nowrap">
                Custom Rugs
              </a>

              <div className="flex items-center gap-2 sm:gap-3 lg:ml-4 flex-shrink-0">
                <button
                  onClick={() => setShowCartModal(true)}
                  className="text-gray-100 hover:text-orange-500 transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
                  {cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-orange-600 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showMobileMenu && (
          <div className="lg:hidden border-t border-gray-800 bg-black/95 backdrop-blur-sm max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-4">
                <a
                  href="#"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-100 hover:text-orange-500 transition-colors text-lg font-medium tracking-wide py-2"
                >
                  Home
                </a>
                <a
                  href="#about"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-100 hover:text-orange-500 transition-colors text-lg font-medium tracking-wide py-2"
                >
                  About Us
                </a>
                <a
                  href="#tracker"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-100 hover:text-orange-500 transition-colors text-lg font-medium tracking-wide py-2"
                >
                  Shipment Tracker
                </a>
                <a
                  href="#premade"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-100 hover:text-orange-500 transition-colors text-lg font-medium tracking-wide py-2"
                >
                  Pre-made Rugs
                </a>
                <a
                  href="#custom"
                  onClick={() => setShowMobileMenu(false)}
                  className="text-gray-100 hover:text-orange-500 transition-colors text-lg font-medium tracking-wide py-2"
                >
                  Custom Rugs
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className={`transition-all duration-300 ${isScrolled ? 'pt-28 sm:pt-32 lg:pt-36' : 'pt-40 sm:pt-48 lg:pt-72'}`}>
        <section className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden rounded-xl sm:rounded-2xl lg:rounded-3xl mx-4 sm:mx-6 lg:mx-8 shadow-2xl">
          <img
            src="https://esvrzocrrwabwrvlurpf.supabase.co/storage/v1/object/public/promo/2tr-workstation-full.png"
            alt="Two Tuft Rugs Workshop"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

          <div className="relative z-10 text-center sm:text-right px-4 sm:pr-0 max-w-3xl sm:ml-auto sm:mt-8 sm:mr-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight italic font-bold">
              Too Tough to Tear,<br />Too Beautiful to Ignore
            </h1>
          </div>
        </section>

        <section id="about" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-36 sm:scroll-mt-44 lg:scroll-mt-68">
          <div className="container mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 lg:mb-8 tracking-tight">About Us</h2>
                <div className="space-y-4 sm:space-y-6 text-gray-300 text-base sm:text-lg leading-relaxed">
                  <p>
                    Two Tuft Rugs is a handcrafted rug company dedicated to bringing unique,
                    custom-designed rugs to life. Each piece is meticulously crafted with passion
                    and precision using traditional tufting techniques combined with modern design sensibilities.
                  </p>
                  <p>
                    Founded with a vision to transform spaces through artful textile creations,
                    we specialize in both custom orders and carefully curated pre-made designs.
                    Our workshop is where creativity meets craftsmanship. From concept to completion,
                    we work closely with our clients to ensure every detail reflects their vision
                    and personality.
                  </p>
                  <p>
                   Every rug tells a story, and we're here to help you tell yours. 
                   Too tough to tear, too beautiful to ignore! We are, Two Tuft!
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-800">
                  <video
                    src="/2trpromo_compressed.mp4"
                    className="w-full h-full object-cover bg-gradient-to-br from-gray-900 to-black"
                    controls
                    muted
                    playsInline
                    autoPlay
                    onEnded={(e) => {
                      const video = e.currentTarget;
                      video.currentTime = 0;
                      video.pause();
                    }}
                    onError={(e) => {
                      console.error('Video failed to load');
                      console.error('Video URL:', `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/promo/2trpromo_compressed.mp4`);
                      console.error('Error details:', e);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="premade" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 scroll-mt-36 sm:scroll-mt-44 lg:scroll-mt-68">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Pre-made Rugs</h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Explore our curated collection of handcrafted rugs, ready to ship and transform your space. All pre-made rugs (Mini & Small) include a felt backing!
              </p>
            </div>

            {isLoadingRugs ? (
              <div className="flex justify-center items-center py-24">
                <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />
              </div>
            ) : rugsError ? (
              <div className="bg-red-900/20 border-2 border-red-600 rounded-2xl p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 text-lg">{rugsError}</p>
                <button
                  onClick={loadPremadeRugs}
                  className="mt-4 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : premadeRugs.length === 0 ? (
              <div className="bg-gray-900/30 border-2 border-gray-800 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No rugs available at the moment. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {premadeRugs.map((rug) => (
                  <div key={rug.id} className="group bg-gray-900/50 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-gray-800 hover:border-orange-500 transition-all duration-300">
                    <div
                      className="aspect-square bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden cursor-pointer relative"
                      onClick={() => openGallery(rug)}
                    >
                      {rug.image ? (
                        <>
                          <img
                            src={rug.image}
                            alt={rug.title || 'Rug'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {getGalleryImages(rug).length > 1 && (
                            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {getGalleryImages(rug).length} photos
                            </div>
                          )}
                        </>
                      ) : (
                        <Package className="w-16 h-16 sm:w-24 sm:h-24 text-gray-700 group-hover:text-orange-500 transition-colors" strokeWidth={1.5} />
                      )}
                    </div>
                    <div className="p-4 sm:p-6">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">{rug.title || 'Untitled Rug'}</h3>
                      <p className="text-gray-400 text-sm sm:text-base mb-4 line-clamp-2">{rug.description || 'No description available'}</p>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                        <span className="text-2xl sm:text-3xl font-bold text-orange-500">
                          ${rug.price ? parseFloat(rug.price).toFixed(2) : '0.00'}
                        </span>
                        <button
                          onClick={() => handleAddToCart(rug)}
                          className="w-full sm:w-auto px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section id="custom" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900 scroll-mt-36 sm:scroll-mt-44 lg:scroll-mt-68">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-10 sm:mb-12 lg:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Custom Rugs</h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto px-4">
                Bring your vision to life with a one-of-a-kind handcrafted rug designed just for you or your company!
              </p>
            </div>

            <div className="bg-gray-900/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-800 mb-10 sm:mb-12 lg:mb-16">
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 text-center">Pricing Guide</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-medium text-white mb-2">Small</h4>
                  <p className="text-gray-400 mb-2 text-sm sm:text-base">Up to 2' x 2'</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">Starting at $189</p>
                </div>
                <div className="text-center">
                  <h4 className="text-lg sm:text-xl font-medium text-white mb-2">Medium</h4>
                  <p className="text-gray-400 mb-2 text-sm sm:text-base">3' x 1' to 3' x 3'</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">Starting at $299</p>
                </div>
                <div className="text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-full h-full pointer-events-none z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] bg-yellow-500 text-black font-bold text-xs sm:text-sm py-2 px-16 whitespace-nowrap shadow-lg">
                      COMING SOON
                    </div>
                  </div>
                  <h4 className="text-lg sm:text-xl font-medium text-white mb-2">Large</h4>
                  <p className="text-gray-400 mb-2 text-sm sm:text-base">4' x 1' to 4' x 4'</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">Starting at $449</p>
                </div>
              </div>
              <p className="text-gray-400 text-center mt-6 text-sm sm:text-base px-4">
                Final pricing depends on size, complexity, and materials. We'll provide a detailed quote after consultation. All custom preojects will begin upon receipt of payment and will take a minimum of 1 week for completion.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-10 sm:mb-12 lg:mb-16">
              <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-800">
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-6">The Process</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg mb-1">Share Your Vision</h4>
                      <p className="text-gray-400">Tell us about your design ideas, colors, and dimensions</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg mb-1">Design Consultation</h4>
                      <p className="text-gray-400">We'll work together to refine your concept and create a mockup</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg mb-1">Handcrafted Creation</h4>
                      <p className="text-gray-400">Our artisans bring your design to life with expert tufting</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg mb-1">Quality Delivery</h4>
                      <p className="text-gray-400">Your custom rug arrives ready to transform your space</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900/50 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-800">
                <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-6">Start Your Custom Order</h3>
                <form onSubmit={handleCustomOrderSubmit} className="space-y-5 sm:space-y-6">
                  <div>
                    <label className="block text-white font-medium mb-2">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-5">
                    <h4 className="text-white font-semibold text-lg">Shipping Address</h4>

                    <div>
                      <label className="block text-white font-medium mb-2">Street Address</label>
                      <input
                        type="text"
                        value={formData.shippingAddressLine1}
                        onChange={(e) => setFormData({ ...formData, shippingAddressLine1: e.target.value })}
                        required
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Apartment, Suite, etc. (Optional)</label>
                      <input
                        type="text"
                        value={formData.shippingAddressLine2}
                        onChange={(e) => setFormData({ ...formData, shippingAddressLine2: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                        placeholder="Apt 4B"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">City</label>
                        <input
                          type="text"
                          value={formData.shippingCity}
                          onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">State</label>
                        <input
                          type="text"
                          value={formData.shippingState}
                          onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                          placeholder="State"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white font-medium mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.shippingZip}
                          onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                          placeholder="12345"
                        />
                      </div>
                      <div>
                        <label className="block text-white font-medium mb-2">Country</label>
                        <input
                          type="text"
                          value={formData.shippingCountry}
                          onChange={(e) => setFormData({ ...formData, shippingCountry: e.target.value })}
                          required
                          className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Design Description</label>
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors resize-none"
                      placeholder="Describe your design ideas, colors, patterns, or inspiration..."
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">Upload Design Reference</label>
                    <div className="relative">
                      <input
                        type="file"
                        id="design-upload"
                        accept="image/*"
                        onChange={(e) => setDesignFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <label
                        htmlFor="design-upload"
                        className="flex flex-col items-center justify-center w-full px-4 py-8 bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-orange-500 transition-colors"
                      >
                        <Upload className="w-12 h-12 text-gray-500 mb-3" strokeWidth={1.5} />
                        {designFile ? (
                          <div className="text-center">
                            <p className="text-white font-medium">{designFile.name}</p>
                            <p className="text-gray-400 text-sm mt-1">Click to change file</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <p className="text-white font-medium">Click to upload design reference</p>
                            <p className="text-gray-400 text-sm mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Dimensions</label>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDimension("1' x 1'");
                          setCustomWidth('');
                          setCustomHeight('');
                        }}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          selectedDimension === "1' x 1'"
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        1' x 1'
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDimension("2' x 2'");
                          setCustomWidth('');
                          setCustomHeight('');
                        }}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          selectedDimension === "2' x 2'"
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        2' x 2'
                      </button>
                      <button
                        type="button"
                        disabled
                        className="px-6 py-4 rounded-lg font-medium transition-all border-2 bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed opacity-50"
                      >
                        3' x 3'
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDimension('custom')}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          selectedDimension === 'custom'
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        Custom Size
                      </button>
                    </div>

                    {selectedDimension === 'custom' && (
                      <div className="space-y-4">
                        <p className="text-gray-400 text-sm">Select custom dimensions (12-48 inches)</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Width (inches)</label>
                            <select
                              value={customWidth}
                              onChange={(e) => setCustomWidth(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                            >
                              <option value="">Select width</option>
                              {Array.from({ length: 37 }, (_, i) => i + 12).map(inches => {
                                const isComingSoon = inches > 36;
                                return (
                                  <option
                                    key={inches}
                                    value={inches}
                                    disabled={isComingSoon}
                                    className={isComingSoon ? 'text-gray-500' : ''}
                                  >
                                    {inches}" {isComingSoon ? '(Coming Soon)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">Height (inches)</label>
                            <select
                              value={customHeight}
                              onChange={(e) => setCustomHeight(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white focus:border-orange-500 focus:outline-none transition-colors"
                            >
                              <option value="">Select height</option>
                              {Array.from({ length: 37 }, (_, i) => i + 12).map(inches => {
                                const isComingSoon = inches > 36;
                                return (
                                  <option
                                    key={inches}
                                    value={inches}
                                    disabled={isComingSoon}
                                    className={isComingSoon ? 'text-gray-500' : ''}
                                  >
                                    {inches}" {isComingSoon ? '(Coming Soon)' : ''}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Cut Option</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setCutOption('Cut to Dimension Border')}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          cutOption === 'Cut to Dimension Border'
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        Cut to Dimension Border
                      </button>
                      <button
                        type="button"
                        onClick={() => setCutOption('Cut to Image Outline')}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          cutOption === 'Cut to Image Outline'
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        Cut to Image Outline
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-3">Backing Option</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setBackingOption('Non-Slip Floor Finish')}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          backingOption === 'Non-Slip Floor Finish'
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        Non-Slip Floor Finish
                      </button>
                      <button
                        type="button"
                        onClick={() => setBackingOption('Wall Hanging Finish')}
                        className={`px-6 py-4 rounded-lg font-medium transition-all border-2 ${
                          backingOption === 'Wall Hanging Finish'
                            ? 'bg-orange-600 border-orange-600 text-white'
                            : 'bg-gray-800/50 border-gray-700 text-gray-300 hover:border-orange-500'
                        }`}
                      >
                        Wall Hanging Finish
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-lg"
                  >
                    {isSubmitting ? 'Submitting...' : 'Request Approval'}
                  </button>
                </form>

                {submitStatus && (
                  <div
                    className={`mt-4 p-4 rounded-lg border-2 flex items-start gap-3 ${
                      submitStatus.type === 'success'
                        ? 'bg-green-900/20 border-green-600 text-green-400'
                        : 'bg-red-900/20 border-red-600 text-red-400'
                    }`}
                  >
                    {submitStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{submitStatus.message}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-800 max-w-2xl w-full my-4">
            <div className="sticky top-0 bg-gray-900 border-b-2 border-gray-800 p-4 sm:p-6 flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">Order Summary</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {submitStatus ? (
                <>
                  <div
                    className={`p-4 rounded-lg border-2 flex items-start gap-3 ${
                      submitStatus.type === 'success'
                        ? 'bg-green-900/20 border-green-600 text-green-400'
                        : 'bg-red-900/20 border-red-600 text-red-400'
                    }`}
                  >
                    {submitStatus.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm">{submitStatus.message}</p>
                  </div>
                  {submitStatus.type === 'success' && (
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSubmitStatus(null);
                      }}
                      className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Name</h4>
                    <p className="text-white text-lg">{formData.name}</p>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Email</h4>
                    <p className="text-white text-lg">{formData.email}</p>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Shipping Address</h4>
                    <div className="text-white text-lg space-y-1">
                      <p>{formData.shippingAddressLine1}</p>
                      {formData.shippingAddressLine2 && <p>{formData.shippingAddressLine2}</p>}
                      <p>{formData.shippingCity}, {formData.shippingState} {formData.shippingZip}</p>
                      <p>{formData.shippingCountry}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Design Description</h4>
                    <p className="text-white text-lg">{formData.description}</p>
                  </div>

                  {designFile && (
                    <div>
                      <h4 className="text-gray-400 text-sm font-medium mb-2">Design Reference</h4>
                      <div className="bg-gray-800/50 rounded-lg p-4 border-2 border-gray-700">
                        <img
                          src={URL.createObjectURL(designFile)}
                          alt="Design reference"
                          className="w-full h-auto rounded-lg mb-3"
                        />
                        <p className="text-white font-medium">{designFile.name}</p>
                        <p className="text-gray-400 text-sm">{(designFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Dimensions</h4>
                    <p className="text-white text-lg">
                      {selectedDimension === 'custom'
                        ? `${formatInchesToFeet(customWidth)} x ${formatInchesToFeet(customHeight)} (Custom)`
                        : selectedDimension || 'Not selected'}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Cut Option</h4>
                    <p className="text-white text-lg">{cutOption || 'Not selected'}</p>
                  </div>

                  <div>
                    <h4 className="text-gray-400 text-sm font-medium mb-2">Backing Option</h4>
                    <p className="text-white text-lg">{backingOption || 'Not selected'}</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSubmitStatus(null);
                      }}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      Edit Order
                    </button>
                    <button
                      onClick={handleConfirmOrder}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {isSubmitting ? 'Submitting...' : 'Confirm Order'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl sm:rounded-2xl border-2 border-gray-800 max-w-4xl w-full my-4">
            <div className="sticky top-0 bg-gray-900 border-b-2 border-gray-800 p-4 sm:p-6 flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold text-white">Shopping Cart</h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-gray-700 mx-auto mb-4" strokeWidth={1.5} />
                  <p className="text-gray-400 text-base sm:text-lg">Your cart is empty</p>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="mt-6 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {Array.from(new Map(cartItems.map(item => [item.id, item])).values()).map((rug) => {
                      const quantity = cartItems.filter(item => item.id === rug.id).length;
                      return (
                        <div
                          key={rug.id}
                          className="flex gap-4 bg-gray-800/30 rounded-xl p-4 border-2 border-gray-800"
                        >
                          {rug.image && (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={rug.image}
                                alt={rug.title || 'Rug'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="text-xl font-semibold text-white mb-2">
                              {rug.title || 'Untitled Rug'}
                            </h4>
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                              {rug.description || 'No description available'}
                            </p>
                            <div className="flex items-center gap-4">
                              <p className="text-2xl font-bold text-orange-500">
                                ${rug.price ? parseFloat(rug.price).toFixed(2) : '0.00'}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Quantity: {quantity}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(rug.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors self-start"
                          >
                            <X className="w-6 h-6" strokeWidth={1.5} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t-2 border-gray-800 pt-6">
                    <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-2 border-orange-600/30 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">%</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-lg mb-1">Have a Coupon Code?</h4>
                          <p className="text-gray-300 text-sm mb-3">
                            You'll be able to enter your promotional code on the next page during checkout.
                          </p>
                          <button
                            onClick={() => setShowCouponInfo(!showCouponInfo)}
                            className="text-orange-400 hover:text-orange-300 text-sm font-medium underline"
                          >
                            {showCouponInfo ? 'Hide details' : 'Learn more'}
                          </button>
                          {showCouponInfo && (
                            <div className="mt-3 text-gray-300 text-sm bg-black/30 rounded-lg p-3 border border-gray-700">
                              <p className="mb-2">On the checkout page, look for the link that says:</p>
                              <p className="font-mono text-orange-400 mb-2">"Add promotion code"</p>
                              <p>Click it to reveal the coupon code field where you can enter your discount code.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <span className="text-xl text-gray-300">Total:</span>
                      <span className="text-3xl font-bold text-orange-500">
                        ${cartItems.reduce((sum, rug) => sum + (rug.price ? parseFloat(rug.price) : 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={async () => {
                        if (cartItems.length === 0) return;
                        setCheckoutLoading('cart');
                        try {
                          const priceIds = cartItems
                            .map(rug => rug.stripe_price_id)
                            .filter((id): id is string => id !== null && id !== undefined);

                          if (priceIds.length === 0) {
                            alert('No valid items in cart');
                            return;
                          }

                          const { url } = await createCheckoutSessionForCart(priceIds, 'payment');
                          window.location.href = url;
                        } catch (error) {
                          console.error('Checkout error:', error);
                          alert('Unable to process checkout. Please try again.');
                        } finally {
                          setCheckoutLoading(null);
                        }
                      }}
                      disabled={checkoutLoading === 'cart'}
                      className="w-full px-8 py-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors text-lg"
                    >
                      {checkoutLoading === 'cart' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                          Processing...
                        </>
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-xl border-2 border-orange-600 max-w-md w-full p-6 my-4">
            <div className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-orange-600/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" strokeWidth={2} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Quantity Limit Reached</h3>
              <p className="text-gray-300 mb-6">
                You can only add a maximum of 2 of the same rug to your cart.
              </p>
              <button
                onClick={() => setShowLimitModal(false)}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedRugForGallery && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto"
          onClick={closeGallery}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <button
              onClick={closeGallery}
              className="fixed top-4 right-4 text-white hover:text-orange-500 transition-colors z-10"
            >
              <X className="w-8 h-8 sm:w-10 sm:h-10" strokeWidth={2} />
            </button>

            <div
              className="relative max-w-6xl w-full my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {getGalleryImages(selectedRugForGallery).length > 0 ? (
                <>
                  <div className="relative aspect-square sm:aspect-video bg-gray-900 rounded-xl overflow-hidden">
                    <img
                      src={getGalleryImages(selectedRugForGallery)[currentImageIndex]}
                      alt={`${selectedRugForGallery.title || 'Rug'} - Image ${currentImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {getGalleryImages(selectedRugForGallery).length > 1 && (
                    <>
                      <button
                        onClick={previousImage}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-orange-600 text-white p-2 sm:p-3 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
                      </button>

                      <button
                        onClick={nextImage}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-orange-600 text-white p-2 sm:p-3 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2} />
                      </button>

                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                        {currentImageIndex + 1} / {getGalleryImages(selectedRugForGallery).length}
                      </div>
                    </>
                  )}

                  <div className="mt-6 sm:mt-8 text-center pb-8">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      {selectedRugForGallery.title || 'Untitled Rug'}
                    </h3>
                    <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto px-4">
                      {selectedRugForGallery.description || 'No description available'}
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-orange-500 mt-4 mb-6">
                      ${selectedRugForGallery.price ? parseFloat(selectedRugForGallery.price).toFixed(2) : '0.00'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(selectedRugForGallery);
                        closeGallery();
                      }}
                      className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors text-lg"
                    >
                      Add to Cart
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Package className="w-24 h-24 mx-auto mb-4" strokeWidth={1.5} />
                  <p>No images available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section id="tracker" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900 scroll-mt-36 sm:scroll-mt-44 lg:scroll-mt-68">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-4 sm:mb-6">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-orange-500" strokeWidth={1.5} />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight">Track Your Order</h2>
            <p className="text-gray-400 text-base sm:text-lg px-4">
              [Custom Rugs Only]
            </p>
            <p className="text-gray-400 text-base sm:text-lg px-4">
              Enter your order number to see the status of your custom rug
            </p>
          </div>

          <form onSubmit={handleTrackShipment} className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value.toUpperCase());
                    setTrackingError(null);
                  }}
                  placeholder="Enter your order number (e.g., 2TR-20241212-12345)"
                  className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-4 sm:py-5 bg-gray-800/50 border-2 border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none transition-colors text-base sm:text-lg"
                />
              </div>
              <button
                type="submit"
                disabled={isTrackingLoading}
                className="px-8 sm:px-10 py-4 sm:py-5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-base sm:text-lg whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isTrackingLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Tracking...
                  </>
                ) : (
                  'Track Order'
                )}
              </button>
            </div>

            {trackingError && (
              <div className="mt-4 p-4 bg-red-900/20 border-2 border-red-600 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400">{trackingError}</p>
              </div>
            )}
          </form>

          {trackingInfo && (
            <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border-2 border-gray-700">
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Customer Name</p>
                  <p className="text-white font-medium">{trackingInfo.name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Dimensions</p>
                  <p className="text-white font-medium">{trackingInfo.dimensions}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Backing Option</p>
                  <p className="text-white font-medium">{trackingInfo.backing_option}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Cut Option</p>
                  <p className="text-white font-medium">{trackingInfo.cut_option || 'N/A'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-gray-400 mb-1">Order Date</p>
                  <p className="text-white font-medium">
                    {new Date(trackingInfo.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-800/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-2 border-gray-800">
            <h3 className="text-2xl font-semibold text-white mb-6">Order Timeline</h3>
            <div className="space-y-6">
              {[
                { stage: 0, title: 'Order Placed', description: 'Your custom rug order has been received', status: 'pending' },
                { stage: 1, title: 'In Production', description: 'Your rug is being handcrafted', status: 'in_production' },
                { stage: 2, title: 'Quality Check', description: 'Final inspection and packaging', status: 'quality_check' },
                { stage: 3, title: 'Shipped', description: 'On its way to your doorstep', status: 'shipped' },
                { stage: 4, title: 'Delivered', description: 'Enjoy your custom rug!', status: 'delivered' }
              ].map(({ stage, title, description, status }) => {
                const currentStage = trackingInfo ? getOrderStageIndex(trackingInfo) : -1;
                const isActive = stage <= currentStage;
                const isCurrent = stage === currentStage;

                return (
                  <div key={stage} className={`flex items-start gap-4 ${!isActive && trackingInfo ? 'opacity-50' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                      isActive ? 'bg-orange-600' : 'bg-gray-700'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${
                        isActive ? 'bg-white' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div>
                      <h4 className={`font-medium text-lg mb-1 ${
                        isCurrent ? 'text-orange-400' : 'text-white'
                      }`}>
                        {title}
                        {isCurrent && ' (Current)'}
                      </h4>
                      <p className="text-gray-400">{description}</p>
                      {trackingInfo && isActive && trackingInfo.updated_at && (
                        <p className="text-gray-500 text-sm mt-1">
                          Updated: {new Date(trackingInfo.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-black border-t border-gray-800 py-6 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-400 text-sm">
            Designed, created, and powered by Two Tier Tech LLC (2026)
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

