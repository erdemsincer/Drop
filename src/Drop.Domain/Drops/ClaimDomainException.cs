using Drop.Domain.Common;

namespace Drop.Domain.Drops;

public sealed class ClaimDomainException : DomainException
{
    public ClaimDomainException(string code, string message)
        : base(code, message)
    {
    }
}
