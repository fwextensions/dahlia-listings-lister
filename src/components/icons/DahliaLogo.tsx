import React from "react";

interface DahliaLogoProps {
	// width/height in px (or any CSS size string)
	size?: number | string;
	// sets CSS color; since fill is currentColor, this sets the icon fill
	color?: string;
	className?: string;
	title?: string;
}

const DahliaLogo = ({ size = 24, color, className, title }: DahliaLogoProps) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="282.1 11 90.6 82.6"
			width={size}
			height={size}
			fill="currentColor"
			style={color ? { color } : undefined}
			className={className}
			aria-hidden={title ? undefined : true}
			role={title ? "img" : "presentation"}
		>
			{title ? <title>{title}</title> : null}
			<path d="M361.7,39.4h-0.1v43.4h-68.4V39.4l34.3-16.3L361.7,39.4z M340.6,45.7h-10.4v21.6h10.4V45.7z M314.2,45.7v21.6h10.4V45.7H314.2z M361.7,88.2h-68.4l-5.5,5.4h79.6L361.7,88.2z M372.7,32.5L327.4,11l-18.7,8.8V11h-10.4v13.8 l-16.2,7.7l5.5,3.4L327.4,17l39.8,18.9L372.7,32.5z" />
		</svg>
	);
};

export default DahliaLogo;
