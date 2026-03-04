// import { AudioWaveform } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '@/assets/images/project-management.png'

const Logo = (props: { url?: string }) => {
  const { url = '/' } = props;
  return (
    <div className="flex items-center justify-center sm:justify-start">
      <Link to={url}>
        {/* <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <AudioWaveform className="size-4" />
        </div> */}
        <img
          src={logo}
          alt="f"
          className="inline-block w-[30px] rounded-sm"
        />
      </Link>
    </div>
  );
};

export default Logo;

