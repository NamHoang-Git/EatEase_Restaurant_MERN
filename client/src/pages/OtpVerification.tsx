import { FC } from 'react';
import LiquidEther from '@/components/LiquidEther';
import { OtpVerificationForm } from '@/components/otpVerification/otp-verification-form';
import logo from '@/assets/logo2.png';
import { Link } from 'react-router-dom';

const OtpVerificationPage: FC = () => {
    return (
        <div className="relative grid min-h-svh bg-white/50">
            <div className="fixed inset-0 z-0 pointer-events-none">
                <LiquidEther
                    colors={['#FFE6E6', '#FFD8A9', '#FFF5C2']}
                    isViscous={false}
                    iterationsViscous={8}
                    iterationsPoisson={8}
                    resolution={0.3}
                    autoDemo={true}
                    autoSpeed={0.2}
                    autoRampDuration={0.8}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <div className="liquid-glass grid">
                <div className="relative flex flex-col gap-4 p-6 md:p-10">
                    <div className="flex justify-center gap-2 md:justify-start mb-2">
                        <Link
                            to="/"
                            className="flex items-center gap-2 font-bold text-red-700 text-lg"
                        >
                            <img src={logo} alt="Logo" width={30} height={30} />
                            EatEase
                        </Link>
                    </div>
                    <div className="flex flex-1 items-center justify-center">
                        <div className="w-full md:max-w-md xl:max-w-2xl">
                            <OtpVerificationForm />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OtpVerificationPage;
