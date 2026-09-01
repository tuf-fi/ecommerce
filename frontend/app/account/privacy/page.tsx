import PageHeading from "@/components/ui/PageHeading";

export default function PrivacyPolicyPage() {
    return (
        <div>
            <PageHeading>Privacy Policy</PageHeading>
            {/* TODO: placeholder policy text — replace with the real, legally-reviewed policy before launch. */}
            <p className="mb-8 text-[12px] text-grey">Last updated: August 1, 2026</p>

            <div className="flex max-w-[560px] flex-col gap-7 text-[13.5px] leading-relaxed text-grey">
                <p>
                    We take your privacy seriously. This policy describes how Cindyrella collects, uses, and protects
                    your personal information when you shop with us.
                </p>

                <div>
                    <h3 className="mb-2 text-[14px] font-medium text-ink">1. Information We Collect</h3>
                    <p>
                        We collect information you provide directly, including your name, email address, delivery
                        addresses, and order history. Payment details are handled by our payment processor and are
                        never stored on our servers.
                    </p>
                </div>

                <div>
                    <h3 className="mb-2 text-[14px] font-medium text-ink">2. How We Use Your Data</h3>
                    <p>Your data is used to:</p>
                    <ul className="mt-2 flex flex-col gap-1.5 pl-5 list-disc">
                        <li>Process and deliver your orders</li>
                        <li>Provide customer support and order tracking</li>
                        <li>Send order updates and, if opted in, promotional messages</li>
                        <li>Improve our products and shopping experience</li>
                    </ul>
                </div>

                <div>
                    <h3 className="mb-2 text-[14px] font-medium text-ink">3. Data Security</h3>
                    <p>
                        We implement industry-standard security measures to protect your personal information.
                        Passwords are encrypted, and we never share your data with third parties beyond what&apos;s
                        required to fulfill your order.
                    </p>
                </div>

                <div>
                    <h3 className="mb-2 text-[14px] font-medium text-ink">4. Your Choices</h3>
                    <p>
                        You can review or update your information at any time from My Account, manage your notification
                        preferences, or request that we delete your account by contacting hello@cindyrella.ph.
                    </p>
                </div>
            </div>
        </div>
    );
}
