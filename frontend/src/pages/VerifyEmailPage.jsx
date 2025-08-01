import React, { useEffect, useState } from "react";
import { Card, Typography, Button, Spin } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import publicClient from "../api/clients/public.client";
import { MailOutlined, CheckCircleTwoTone } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const email = params.get("email");
  const verifyKey = params.get("verifyKey");
  const [loading, setLoading] = useState(!!(email && verifyKey));
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!email || !verifyKey) return;
      setLoading(true);
      try {
        await publicClient.get(
          `/user/verify?email=${encodeURIComponent(email)}&verifyKey=${verifyKey}`
        );
        setIsVerified(true);
      } catch {
        // Bỏ qua lỗi, không show error
      } finally {
        setLoading(false);
      }
    };
    if (email && verifyKey) verifyEmail();
  }, [email, verifyKey]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-orange-100 to-pink-100">
        <Spin tip="Đang xác thực email..." size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 via-orange-100 to-pink-100 p-4">
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-2xl border-0 text-center py-10 px-6">
          <div className="flex flex-col items-center mb-6">
            {isVerified ? (
              <CheckCircleTwoTone twoToneColor="#22c55e" style={{ fontSize: 48 }} />
            ) : (
              <MailOutlined className="text-orange-500" style={{ fontSize: 48 }} />
            )}
          </div>
          {isVerified ? (
            <>
              <Title level={3} className="text-green-500 mb-2">
                Xác thực Email thành công!
              </Title>
              <Paragraph className="text-gray-700">
                Email của bạn đã được xác thực.<br />
                Bạn có thể đăng nhập ngay.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                block
                className="rounded-lg bg-gradient-to-r from-green-400 to-green-500 border-0 mt-4 font-semibold"
                onClick={() => navigate("/auth/signin")}
              >
                Đăng nhập
              </Button>
            </>
          ) : (
            <>
              <Title level={3} className="text-orange-500 mb-2">
                Đã gửi email xác thực
              </Title>
              <Paragraph className="text-gray-700">
                {email ? (
                  <>
                    Chúng tôi đã gửi một email xác thực đến <b>{email}</b>.<br />
                    Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                  </>
                ) : (
                  <>
                    Chúng tôi đã gửi một email xác thực.<br />
                    Vui lòng kiểm tra hộp thư.
                  </>
                )}
              </Paragraph>
              <Button
                type="primary"
                size="large"
                block
                className="rounded-lg bg-gradient-to-r from-orange-400 to-pink-400 border-0 mt-4 font-semibold"
                onClick={() => navigate("/auth/signin")}
              >
                Quay lại đăng nhập
              </Button>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmailPage;